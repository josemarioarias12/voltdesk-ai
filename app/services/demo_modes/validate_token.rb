# frozen_string_literal: true

module DemoModes
  class ValidateToken
    MAX_GUESTS = 50

    def self.call(**args) = new(**args).call

    def initialize(token:)
      @token = token
    end

    def call
      workspace_id = redis.get(token_key)
      return ServiceResult.failure(:expired) if workspace_id.nil?

      workspace = Workspace.find_by(id: workspace_id)
      return ServiceResult.failure(:workspace_not_found) if workspace.nil?

      current_count = redis.get(count_key).to_i
      return ServiceResult.failure(:capacity_reached) if current_count >= MAX_GUESTS

      new_count = redis.incr(count_key)
      ttl       = redis.ttl(token_key)

      ServiceResult.success({ workspace: workspace, guest_count: new_count, expires_in: ttl })
    rescue StandardError => e
      Rails.logger.error("[DemoModes::ValidateToken] Unexpected error for token #{@token}: #{e.message}")
      ServiceResult.failure(:unexpected_error)
    end

    private

    def redis     = REDIS
    def token_key = "demo_token:#{@token}"
    def count_key = "demo_count:#{@token}"
  end
end
