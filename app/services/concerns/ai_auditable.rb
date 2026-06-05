# frozen_string_literal: true

module AiAuditable
  def with_ai_audit(operation:, model: 'gpt-4o', provider: 'openai', _user: nil)
    audit_ctx = {}
    started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    begin
      result = yield audit_ctx

      duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).to_i

      log_ai_call(
        operation: operation,
        model: model,
        provider: provider,
        prompt: audit_ctx[:prompt].to_s,
        response: audit_ctx[:response].to_s,
        tokens: audit_ctx[:tokens] || {},
        duration_ms: duration_ms,
        confidence: audit_ctx[:confidence],
        status: :success
      )

      result
    rescue StandardError => e
      duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).to_i

      log_ai_call(
        operation: operation,
        model: model,
        provider: provider,
        prompt: audit_ctx[:prompt].to_s,
        response: e.message,
        tokens: {},
        duration_ms: duration_ms,
        confidence: nil,
        status: :error
      )

      raise
    end
  end

  private

  def log_ai_call(operation:, model:, provider:, prompt:, response:, tokens:, duration_ms:, confidence:, status:)
    AiAuditLog.create!(
      workspace: resolve_workspace,
      user: resolve_user,
      operation: operation,
      model: model,
      provider: provider,
      prompt: prompt,
      response: response,
      prompt_tokens: tokens['prompt_tokens'] || tokens[:prompt] || 0,
      completion_tokens: tokens['completion_tokens'] || tokens[:completion] || 0,
      total_tokens: tokens['total_tokens'] || tokens[:total] || 0,
      duration_ms: duration_ms,
      confidence_score: confidence,
      status: status
    )
  rescue StandardError => e
    Rails.logger.error("[AiAuditable] Failed to write AiAuditLog: #{e.class} — #{e.message}")
  end

  def resolve_workspace
    return @workspace if defined?(@workspace) && @workspace
    return @ticket.workspace if defined?(@ticket) && @ticket

    raise '[AiAuditable] Cannot resolve workspace — define @workspace or @ticket in the service'
  end

  def resolve_user
    defined?(@user) ? @user : nil
  end
end
