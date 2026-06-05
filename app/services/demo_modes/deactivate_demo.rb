# frozen_string_literal: true

module DemoModes
  class DeactivateDemo
    def self.call(**args) = new(**args).call

    def initialize(token:)
      @token = token
    end

    def call
      redis.del("demo_token:#{@token}", "demo_count:#{@token}")
      ServiceResult.success
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def redis = REDIS
  end
end
