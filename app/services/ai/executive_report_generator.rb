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
      metrics = gather_metrics
      prompt  = build_prompt(metrics)

      report_text = with_ai_audit(operation: :executive_report) do |ctx|
        ctx[:prompt] = prompt

        response = @client.chat(
          parameters: {
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1500,
            temperature: 0.4
          }
        )

        ctx[:response] = response.dig('choices', 0, 'message', 'content').to_s
        ctx[:tokens]   = response['usage'] || {}

        ctx[:response]
      end

      store_report(report_text, metrics)
      ServiceResult.success(report_text)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def gather_metrics
      week_ago         = 1.week.ago
      tickets          = @workspace.tickets.where(created_at: week_ago..)
      resolved         = tickets.where(status: 3)
      breaches         = tickets.where('due_at < ? AND status NOT IN (?)', Time.current, [3, 4])
      active_alerts    = @workspace.pattern_alerts.active

      {
        total_tickets: tickets.count,
        resolved_tickets: resolved.count,
        sla_compliance_pct: sla_compliance(tickets, resolved),
        sla_breaches: breaches.count,
        active_alerts: active_alerts.count,
        critical_tickets: tickets.where(priority: :critical).count,
        avg_resolution_hrs: avg_resolution(resolved),
        by_department: tickets.joins(:department).group('departments.name').count
      }
    end

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

    def build_prompt(metrics)
      dept_breakdown = metrics[:by_department].map { |k, v| "#{k}: #{v}" }.join(', ')

      <<~PROMPT
        You are an executive assistant generating a weekly operational report for a company using PulseDesk AI.

        Write a professional executive summary in prose (no bullet lists). Include:
        1. Overview of the week's operational performance
        2. Key trends compared to typical benchmarks
        3. Top 3 critical alerts or concerns
        4. Specific actionable recommendations

        METRICS FOR THIS WEEK:
        - Total tickets created: #{metrics[:total_tickets]}
        - Tickets resolved: #{metrics[:resolved_tickets]}
        - SLA compliance: #{metrics[:sla_compliance_pct]}%
        - SLA breaches: #{metrics[:sla_breaches]}
        - Critical priority tickets: #{metrics[:critical_tickets]}
        - Average resolution time: #{metrics[:avg_resolution_hrs]} hours
        - Active pattern alerts: #{metrics[:active_alerts]}
        - Tickets by department: #{dept_breakdown}

        Write the report in English. Be direct, specific, and actionable. Keep it under 400 words.
      PROMPT
    end

    def store_report(text, metrics)
      @workspace.update!(
        settings: @workspace.settings.merge(
          'last_executive_report' => {
            'text' => text,
            'generated_at' => Time.current.iso8601,
            'metrics' => metrics
          }
        )
      )
    end
  end
end
