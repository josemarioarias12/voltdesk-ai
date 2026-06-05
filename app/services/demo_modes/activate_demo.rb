# frozen_string_literal: true

module DemoModes
  class ActivateDemo
    TOKEN_TTL  = 1800
    MAX_GUESTS = 50

    def self.call(**args) = new(**args).call

    def initialize(workspace:)
      @workspace = workspace
    end

    def call
      token = SecureRandom.hex(32)
      redis.set(token_key(token), @workspace.id, ex: TOKEN_TTL)
      redis.set(count_key(token), 0, ex: TOKEN_TTL)
      ServiceResult.success({ token: token, expires_in: TOKEN_TTL, max_guests: MAX_GUESTS })
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def redis            = REDIS
    def token_key(token) = "demo_token:#{token}"
    def count_key(token) = "demo_count:#{token}"
  end
end
