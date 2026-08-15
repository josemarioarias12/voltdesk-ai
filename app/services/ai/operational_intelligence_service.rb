# frozen_string_literal: true

module Ai
  class OperationalIntelligenceService
    include AiAuditable

    MINIMUM_DAYS = 1
    AVERAGE_MANUAL_RESOLUTION_MINUTES = 25
    HOURLY_AGENT_COST = 25.0
    HIGH_RISK_SCORE_THRESHOLD = 80
    COMPLIANCE_SENSITIVE_EVENTS = %i[sensitive_access data_access_denied gdpr_request retention_policy_change].freeze

    def self.call(workspace:, period: 7.days)
      new(workspace: workspace, period: period).call
    end

    def initialize(workspace:, period: 7.days)
      @workspace = workspace
      @period    = period
    end

    def call
      return ServiceResult.failure('insufficient_data') if insufficient_data?

      metrics = collect_metrics
      adapter, model, = Ai::ModelRouter.for(workspace: workspace, operation: :operational_intelligence).resolve
      raw = nil

      with_ai_audit(operation: :operational_intelligence, model: model, provider: 'openai') do |ctx|
        raw = adapter.chat(system: 'You are an operational intelligence analyst for an enterprise bank.',
                           prompt: build_prompt(metrics), model: model, max_tokens: 1500)
        ctx[:confidence] = 0.85
        ctx[:tokens]     = raw[:tokens]
      end

      content = raw[:content].to_s.gsub(/```json|```/, '').strip
      parsed  = JSON.parse(content, symbolize_names: true)
      parsed[:weekly_roi] = { hours_saved: metrics[:roi_hours_saved], cost_saved: metrics[:roi_cost_saved] }
      ServiceResult.success(parsed)
    rescue StandardError => e
      Rails.logger.error("[OperationalIntelligenceService] #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    attr_reader :workspace, :period

    def insufficient_data?
      Ticket.where(workspace: workspace, created_at: period.ago...).count < MINIMUM_DAYS
    end

    def collect_metrics
      since = period.ago
      hours_saved, cost_saved = compute_roi(since)

      {
        workspace_name:         workspace.name,
        ticket_volume_by_day:   ticket_volume_by_day(since),
        tickets_by_department:  tickets_by_department(since),
        sla_breach_by_department: sla_breach_by_department(since),
        avg_confidence:         avg_confidence(since),
        sla_breach_rate:        sla_breach_rate(since),
        correction_count:       ClassificationCorrection.where(workspace: workspace, created_at: since..).count,
        pattern_alerts_count:   PatternAlert.where(workspace: workspace, created_at: since..).count,
        open_tickets_count:     Ticket.where(workspace: workspace, status: %i[open in_progress]).count,
        compliance_risk_events: compliance_risk_events(since),
        high_risk_assets_count: high_risk_assets_count,
        avg_customer_sentiment: avg_customer_sentiment(since),
        automated_resolutions:  automated_resolutions(since),
        roi_hours_saved:        hours_saved,
        roi_cost_saved:         cost_saved,
        period_days:            (period / 1.day).to_i
      }
    end

    def ticket_volume_by_day(since)
      Ticket.where(workspace: workspace, created_at: since..)
            .group('DATE(created_at)')
            .count
    end

    def tickets_by_department(since)
      Ticket.where(workspace: workspace, created_at: since..)
            .joins(:department)
            .group('departments.name')
            .count
    end

    def sla_breach_by_department(since)
      Ticket.where(workspace: workspace, created_at: since..)
            .where('sla_breach_probability > ?', 0.7)
            .joins(:department)
            .group('departments.name')
            .count
    end

    def avg_confidence(since)
      AiAuditLog.where(workspace: workspace, created_at: since.., operation: 'ticket_classification')
                .average(:confidence_score)
                &.round(2) || 0.0
    end

    def sla_breach_rate(since)
      total    = Ticket.where(workspace: workspace, created_at: since..).count
      breached = Ticket.where(workspace: workspace, created_at: since..)
                       .where('sla_breach_probability > ?', 0.7).count
      return 0.0 if total.zero?

      (breached.to_f / total * 100).round(1)
    end

    def compliance_risk_events(since)
      ComplianceLog.where(workspace: workspace, created_at: since..,
                          event_type: COMPLIANCE_SENSITIVE_EVENTS).count
    end

    def high_risk_assets_count
      Asset.where(workspace: workspace)
           .where('risk_score > ? OR status = ?', HIGH_RISK_SCORE_THRESHOLD, Asset.statuses[:in_maintenance])
           .count
    end

    def avg_customer_sentiment(since)
      TicketSatisfactionSurvey.where(workspace: workspace, created_at: since..)
                              .average(:sentiment_score)
                              &.round(2) || 0.0
    end

    def automated_resolutions(since)
      AgentAction.where(workspace: workspace, created_at: since.., status: :completed,
                        action_type: :auto_resolve).count
    end

    def compute_roi(since)
      resolved_count = automated_resolutions(since)
      hours_saved    = ((resolved_count * AVERAGE_MANUAL_RESOLUTION_MINUTES) / 60.0).round(1)
      cost_saved     = (hours_saved * HOURLY_AGENT_COST).round(2)
      [hours_saved, cost_saved]
    end

    def build_prompt(metrics)
      <<~PROMPT
        You are analyzing operational metrics for #{metrics[:workspace_name]}, an enterprise bank
        using an AI-powered IT and HR helpdesk platform. Generate predictions a bank operations
        director would find specific and actionable — reference actual departments and risk areas
        by name, not generic helpdesk language.

        METRICS (last #{metrics[:period_days]} days):
        - Ticket volume by day: #{metrics[:ticket_volume_by_day]}
        - Tickets by department: #{metrics[:tickets_by_department]}
        - SLA breaches by department (probability > 70%): #{metrics[:sla_breach_by_department]}
        - Overall SLA breach rate: #{metrics[:sla_breach_rate]}%
        - Average AI classification confidence: #{metrics[:avg_confidence]}
        - Classification corrections by agents: #{metrics[:correction_count]}
        - Pattern alerts triggered: #{metrics[:pattern_alerts_count]}
        - Currently open/in-progress tickets: #{metrics[:open_tickets_count]}
        - Compliance-sensitive events (data access, GDPR, retention changes): #{metrics[:compliance_risk_events]}
        - High-risk or in-maintenance assets: #{metrics[:high_risk_assets_count]}
        - Average customer satisfaction sentiment (-1 to 1): #{metrics[:avg_customer_sentiment]}
        - Tickets auto-resolved by AI this period: #{metrics[:automated_resolutions]}
        - Computed ROI this period: #{metrics[:roi_hours_saved]} hours saved, $#{metrics[:roi_cost_saved]} saved

        Respond ONLY with valid JSON, no markdown, no explanation:
        {
          "predictions": [
            {
              "type": "volume_spike|sla_risk|confidence_drop|capacity_warning|compliance_risk|asset_maintenance",
              "confidence": 0.0,
              "message": "specific actionable prediction naming the actual department or metric involved",
              "recommendation": "concrete action a bank operations director could act on today",
              "urgency": "critical|warning|info"
            }
          ],
          "summary": "2-sentence executive summary referencing the bank's real risk areas this period"
        }
      PROMPT
    end
  end
end
