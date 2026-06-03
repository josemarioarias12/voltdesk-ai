# frozen_string_literal: true

module Admin
  class OverviewController < BaseController
    def index
      logs = current_workspace.ai_audit_logs

      total          = logs.count
      total_cost     = logs.sum { |l| l.estimated_cost_usd }.round(4)
      avg_confidence = logs.where.not(confidence_score: nil).average(:confidence_score)&.round(2) || 0
      avg_latency    = logs.average(:duration_ms)&.round(0) || 0
      success_count  = logs.where(status: :success).count
      success_rate   = total > 0 ? ((success_count * 100.0) / total).round(1) : 0

      ops_by_type       = logs.unscope(:order).group(:operation).count
      provider_breakdown = logs.unscope(:order).where.not(provider: nil).group(:provider).count

      render inertia: "Admin/Overview", props: {
        stats: {
          total_operations:   total,
          total_cost_usd:     total_cost,
          avg_confidence:     avg_confidence,
          avg_latency_ms:     avg_latency,
          success_rate:       success_rate,
          operations_by_type: ops_by_type,
          provider_breakdown: provider_breakdown
        }
      }
    end
  end
end
