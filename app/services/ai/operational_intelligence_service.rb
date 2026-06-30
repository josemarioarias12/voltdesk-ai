# frozen_string_literal: true

module Ai
  class OperationalIntelligenceService
    include AiAuditable

    MINIMUM_DAYS = 1

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
        raw = adapter.chat(system: 'You are an operational intelligence analyst.',
                           prompt: build_prompt(metrics), model: model)
        ctx[:confidence] = 0.85
        ctx[:tokens]     = raw[:tokens]
      end

      content = raw[:content].to_s.gsub(/```json|```/, '').strip
      parsed  = JSON.parse(content, symbolize_names: true)
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
      {
        ticket_volume_by_day:  ticket_volume_by_day(since),
        avg_confidence:        avg_confidence(since),
        sla_breach_rate:       sla_breach_rate(since),
        correction_count:      ClassificationCorrection.where(workspace: workspace, created_at: since..).count,
        pattern_alerts_count:  PatternAlert.where(workspace: workspace, created_at: since..).count,
        open_tickets_count:    Ticket.where(workspace: workspace, status: %i[open in_progress]).count,
        period_days:           (period / 1.day).to_i
      }
    end

    def ticket_volume_by_day(since)
      Ticket.where(workspace: workspace, created_at: since..)
            .group('DATE(created_at)')
            .count
    end

    def avg_confidence(since)
      AiAuditLog.where(workspace: workspace, created_at: since.., operation: 'classify_ticket')
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

    def build_prompt(metrics)
      <<~PROMPT
        Analyze the following helpdesk metrics and generate actionable predictions.

        METRICS (last #{metrics[:period_days]} days):
        - Ticket volume by day: #{metrics[:ticket_volume_by_day]}
        - Average AI confidence: #{metrics[:avg_confidence]}
        - SLA breach rate (probability > 70%): #{metrics[:sla_breach_rate]}%
        - Classification corrections: #{metrics[:correction_count]}
        - Pattern alerts triggered: #{metrics[:pattern_alerts_count]}
        - Currently open/in-progress tickets: #{metrics[:open_tickets_count]}

        Respond ONLY with valid JSON, no markdown, no explanation:
        {
          "predictions": [
            {
              "type": "volume_spike|sla_risk|confidence_drop|capacity_warning",
              "confidence": 0.0,
              "message": "specific actionable prediction",
              "recommendation": "concrete action",
              "urgency": "critical|warning|info"
            }
          ],
          "weekly_roi": { "hours_saved": 0.0, "cost_saved": 0 },
          "summary": "2-sentence executive summary"
        }
      PROMPT
    end
  end
end
