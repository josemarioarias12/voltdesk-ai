# frozen_string_literal: true

module Ai
  class ModelGovernanceSyncJob < ApplicationJob
    queue_as :ai_processing
    sidekiq_options retry: 2

    def perform(check_types = %w[pricing deprecation])
      suggestion_ids = Array(check_types).flat_map { |type| run_check(type) }

      Ai::GovernanceNotifier.notify(suggestion_ids)
      broadcast_completion(suggestion_ids)
    rescue StandardError => e
      Rails.logger.error("[Ai::ModelGovernanceSyncJob] #{e.class}: #{e.message}")
      raise
    end

    private

    def run_check(type)
      result = checker_for(type)&.call
      return [] unless result&.success?

      result.data[:suggestion_ids] || []
    end

    def checker_for(type)
      {
        'pricing' => Ai::CheckModelPricing,
        'deprecation' => Ai::CheckModelDeprecation
      }[type]
    end

    def broadcast_completion(suggestion_ids)
      ActionCable.server.broadcast('governance_sync', { flagged: suggestion_ids.size })
    end
  end
end
