# frozen_string_literal: true

module Admin
  class AuditLogController < BaseController
    PER_PAGE = 20

    def index
      logs = current_workspace.ai_audit_logs.order(created_at: :desc)

      logs = logs.where(operation: params[:operation]) if params[:operation].present?
      logs = logs.where(provider:  params[:provider])  if params[:provider].present?
      logs = logs.where(status:    params[:status])    if params[:status].present?
      logs = logs.where(created_at: params.expect(:from).to_date..) if params[:from].present?
      logs = logs.where(created_at: ..params.expect(:to).to_date.end_of_day) if params[:to].present?

      total   = logs.count
      page    = (params[:page] || 1).to_i
      entries = logs.limit(PER_PAGE).offset((page - 1) * PER_PAGE)

      render inertia: 'Admin/AuditLog', props: {
        logs: entries.map { |l| serialize_log(l) },
        pagination: { page: page, per_page: PER_PAGE, total: total },
        filters: { operation: params[:operation], provider: params[:provider],
                   status: params[:status], from: params[:from], to: params[:to] },
        operations: AiAuditLog.operations.keys,
        providers: AiAuditLog.where.not(provider: nil).distinct.pluck(:provider).compact
      }
    end

    private

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
