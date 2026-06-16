# frozen_string_literal: true

module ApiKeyAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_api_key!
  end

  private

  def authenticate_api_key!
    token = extract_bearer_token
    @current_api_key = ApiKey.authenticate(token)

    unless @current_api_key
      render json: { error: 'Invalid or missing API key', code: 'unauthorized', status: 401 },
             status: :unauthorized
      return
    end

    @current_workspace = @current_api_key.workspace
    @current_api_key.update_column(:last_used_at, Time.current) # rubocop:disable Rails/SkipsModelValidations
    @api_request_start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end

  def log_api_request(status_code)
    return unless @current_api_key

    duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - @api_request_start) * 1000).round

    ApiRequest.create!(
      workspace:   @current_workspace,
      api_key:     @current_api_key,
      endpoint:    request.path,
      http_method: request.method,
      status_code: status_code,
      duration_ms: duration_ms,
      ip_address:  request.remote_ip,
      created_at:  Time.current
    )
  rescue StandardError => e
    Rails.logger.error("[ApiKeyAuthenticatable] Failed to log request: #{e.message}")
  end

  def extract_bearer_token
    auth_header = request.headers['Authorization']
    return nil unless auth_header&.start_with?('Bearer ')

    auth_header.split(' ', 2).last
  end

  def enforce_scope!(required_scope)
    return if @current_api_key&.scopes&.include?(required_scope.to_s)

    render json: {
      error:    'Insufficient scope',
      code:     'forbidden_scope',
      required: required_scope,
      status:   403
    }, status: :forbidden
  end
end
