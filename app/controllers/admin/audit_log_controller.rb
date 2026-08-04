# frozen_string_literal: true

module Admin
  class AuditLogController < BaseController
    PER_PAGE = 20

    def index
      logs = current_workspace.ai_audit_logs.order(created_at: :desc).filtered_by(filter_params)

      render inertia: 'Admin/AuditLog', props: {
        logs: serialize_logs(paginated(logs)),
        pagination: { page: page, per_page: PER_PAGE, total: logs.count },
        filters: filter_params.to_h,
        operations: AiAuditLog.operations.keys,
        highlight_id: params[:highlight_id].presence&.to_i,
        providers: AiAuditLog.where.not(provider: nil).distinct.pluck(:provider).compact
      }
    end

    private

    def filter_params
      params.permit(:operation, :provider, :status, :from, :to, :assistant_message_id)
    end

    def page
      (params[:page] || 1).to_i
    end

    def paginated(logs)
      logs.limit(PER_PAGE).offset((page - 1) * PER_PAGE)
    end

    def serialize_logs(logs)
      logs.map { |l| serialize_log(l) }
    end

    def serialize_log(log)
      {
        id: log.id,
        operation: log.operation,
        model: log.model,
        provider: log.provider,
        prompt_tokens: log.prompt_tokens,
        completion_tokens: log.completion_tokens,
        total_tokens: log.total_tokens,
        duration_ms: log.duration_ms,
        confidence_score: log.confidence_score,
        status: log.status,
        estimated_cost: log.estimated_cost_usd,
        prompt: log.prompt.to_s.truncate(500),
        response: log.response.to_s.truncate(500),
        created_at: log.created_at.strftime('%b %d, %Y · %I:%M %p')
      }
    end
  end
end
