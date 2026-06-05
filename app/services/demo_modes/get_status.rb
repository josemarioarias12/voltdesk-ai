# frozen_string_literal: true

module DemoModes
  class GetStatus
    def self.call(**args) = new(**args).call

    def initialize(token:)
      @token = token
    end

    def call
      ttl   = REDIS.ttl("demo_token:#{@token}")
      count = REDIS.get("demo_count:#{@token}").to_i
      return ServiceResult.failure(:expired) if ttl.negative?

      ServiceResult.success({ expires_in: ttl, guest_count: count })
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end
  end
end
