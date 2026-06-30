# frozen_string_literal: true

module Ai
  class ExecutiveReportGenerator
    include AiAuditable

    def self.call(workspace:)
      new(workspace: workspace).call
    end

    def initialize(workspace:)
      @workspace = workspace
      @client    = OpenAI::Client.new
    end

    def call
      metrics     = gather_metrics
      trend_data  = gather_trend_data
      prompt      = build_prompt(metrics, trend_data)

      report_text = with_ai_audit(operation: :executive_report) do |ctx|
        ctx[:prompt] = prompt

        response = @client.chat(
          parameters: {
            model:       'gpt-4o',
            messages:    [{ role: 'user', content: prompt }],
            max_tokens:  2000,
            temperature: 0.4
          }
        )

        raw = response.dig('choices', 0, 'message', 'content').to_s
        ctx[:response] = raw
        ctx[:tokens]   = response['usage'] || {}
        raw
      end

      store_report(report_text, metrics, trend_data)
      ServiceResult.success(report_text)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    # ── Current week metrics ────────────────────────────────────────────────

    def gather_metrics
      week_ago      = 1.week.ago
      tickets       = @workspace.tickets.where(created_at: week_ago..)
      resolved      = tickets.where(status: %i[resolved closed])
      breached      = tickets.where('due_at < ? AND status NOT IN (?)', Time.current, [3, 4])
      at_risk_count = @workspace.tickets.open_tickets
                                .where('sla_breach_probability >= 0.70')
                                .count

      {
        total_tickets:       tickets.count,
        resolved_tickets:    resolved.count,
        sla_compliance_pct:  sla_compliance(tickets, resolved),
        sla_breaches:        breached.count,
        at_risk_tickets:     at_risk_count,
        active_alerts:       @workspace.pattern_alerts.active.count,
        anomaly_alerts:      @workspace.pattern_alerts.active.alert_type_department_surge.count,
        critical_tickets:    tickets.where(priority: :critical).count,
        avg_resolution_hrs:  avg_resolution(resolved),
        by_department:       tickets.joins(:department).group('departments.name').count,
        top_bottlenecks:     compute_bottlenecks,
        risk_score:          compute_workspace_risk_score
      }
    end

    # ── 4-week trend data ───────────────────────────────────────────────────

    def gather_trend_data
      (1..4).map do |weeks_ago|
        range     = weeks_ago.weeks.ago..(weeks_ago - 1).weeks.ago
        wk_tix    = @workspace.tickets.where(created_at: range)
        wk_res    = wk_tix.where(status: %i[resolved closed])
        wk_breach = wk_tix.where('due_at < ? AND status NOT IN (?)', Time.current, [3, 4])

        {
          week_label:         "#{weeks_ago}w ago",
          total_tickets:      wk_tix.count,
          resolved_tickets:   wk_res.count,
          sla_compliance_pct: sla_compliance(wk_tix, wk_res),
          sla_breaches:       wk_breach.count,
          avg_resolution_hrs: avg_resolution(wk_res)
        }
      end.reverse
    end

    # ── Bottleneck analysis ─────────────────────────────────────────────────

    def compute_bottlenecks
      dept_stats = @workspace.departments.map do |dept|
        dept_tickets = @workspace.tickets.where(department: dept)
        open_count   = dept_tickets.open_tickets.count
        avg_hrs      = avg_resolution(dept_tickets.where(status: %i[resolved closed]))
        breach_count = dept_tickets.where('due_at < ? AND status NOT IN (?)', Time.current, [3, 4]).count
        cost_hours   = open_count * avg_hrs

        {
          department:           dept.name,
          open_tickets:         open_count,
          avg_resolution_hrs:   avg_hrs,
          sla_breaches:         breach_count,
          estimated_cost_hours: cost_hours.round(1)
        }
      end

      dept_stats.sort_by { |dept| -dept[:estimated_cost_hours] }.first(3)
    end

    # ── Risk score 0–100 ────────────────────────────────────────────────────

    def compute_workspace_risk_score
      open_tickets  = @workspace.tickets.open_tickets.count
      at_risk       = @workspace.tickets.open_tickets
                                .where('sla_breach_probability >= 0.70').count
      anomalies     = @workspace.pattern_alerts.active.alert_type_department_surge.count
      breaches      = @workspace.tickets
                                .where('due_at < ? AND status NOT IN (?)', Time.current, [3, 4]).count

      return 0 if open_tickets.zero?

      breach_ratio  = (breaches.to_f / [open_tickets, 1].max) * 40
      at_risk_ratio = (at_risk.to_f  / [open_tickets, 1].max) * 35
      anomaly_score = [anomalies * 8, 25].min.to_f

      (breach_ratio + at_risk_ratio + anomaly_score).clamp(0, 100).round(1)
    end

    # ── Prompt ──────────────────────────────────────────────────────────────

    def build_prompt(metrics, trend_data)
      dept_breakdown = metrics[:by_department].map { |name, count| "#{name}: #{count}" }.join(', ')

      bottleneck_text = metrics[:top_bottlenecks].each_with_index.map do |dept, idx|
        "#{idx + 1}. #{dept[:department]} — #{dept[:open_tickets]} open tickets, " \
          "avg #{dept[:avg_resolution_hrs]}h resolution, " \
          "#{dept[:sla_breaches]} SLA breaches, " \
          "estimated #{dept[:estimated_cost_hours]} unproductive person-hours"
      end.join("\n")

      trend_text = trend_data.map do |week|
        "#{week[:week_label]}: #{week[:total_tickets]} tickets, " \
          "#{week[:sla_compliance_pct]}% SLA compliance, " \
          "#{week[:avg_resolution_hrs]}h avg resolution"
      end.join("\n")

      <<~PROMPT
        You are an executive assistant generating a weekly operational intelligence briefing
        for a C-suite audience using VoltDesk AI.

        Write a professional report in structured prose with FOUR clearly labeled sections:

        ## Executive Summary
        One paragraph overview of operational health this week vs prior weeks.

        ## Trend Analysis (Last 4 Weeks)
        Identify directional trends — improving, worsening, or stable — with specific numbers.

        ## Top 3 Bottlenecks & Estimated Cost
        For each bottleneck department, include estimated person-hours lost and one specific
        recommendation with projected impact (e.g., "Assigning 2 additional agents to IT
        would reduce SLA breach rate from 34% to ~12% based on historical throughput data").

        ## Next Week Risk Forecast
        Based on workspace risk score (#{metrics[:risk_score]}/100) and current anomalies,
        predict the primary risk for next week and one concrete mitigation action.

        ---

        THIS WEEK METRICS:
        - Total tickets: #{metrics[:total_tickets]}
        - Resolved: #{metrics[:resolved_tickets]}
        - SLA compliance: #{metrics[:sla_compliance_pct]}%
        - SLA breaches: #{metrics[:sla_breaches]}
        - Tickets at risk (AI predicted breach >70%): #{metrics[:at_risk_tickets]}
        - Critical priority: #{metrics[:critical_tickets]}
        - Avg resolution time: #{metrics[:avg_resolution_hrs]}h
        - Active pattern alerts: #{metrics[:active_alerts]}
        - Volumetric anomaly alerts: #{metrics[:anomaly_alerts]}
        - Workspace risk score: #{metrics[:risk_score]}/100
        - Tickets by department: #{dept_breakdown}

        4-WEEK TREND:
        #{trend_text}

        TOP 3 BOTTLENECKS:
        #{bottleneck_text}

        Write in English. Be direct, specific, and data-driven. Use exact numbers.
        Total length: 450–600 words.
      PROMPT
    end

    # ── Helpers ─────────────────────────────────────────────────────────────

    def sla_compliance(tickets, resolved)
      return 100.0 if tickets.none?

      ((resolved.count.to_f / tickets.count) * 100).round(1)
    end

    def avg_resolution(resolved)
      with_times = resolved.where.not(resolved_at: nil)
      return 0.0 if with_times.empty?

      avg_seconds = with_times.average(
        Arel.sql('EXTRACT(EPOCH FROM (resolved_at - created_at))')
      ).to_f
      (avg_seconds / 3600).round(1)
    end

    def store_report(text, metrics, trend_data)
      @workspace.update!(
        settings: @workspace.settings.merge(
          'last_executive_report' => {
            'text'         => text,
            'generated_at' => Time.current.iso8601,
            'metrics'      => metrics,
            'trend_data'   => trend_data
          }
        )
      )
    end
  end
end
