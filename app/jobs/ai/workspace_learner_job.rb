# frozen_string_literal: true

module Ai
  class WorkspaceLearnerJob < ApplicationJob
    queue_as :default
    sidekiq_options retry: 3

    def perform
      Workspace.active.find_each do |workspace|
        result = Ai::WorkspaceLearner.call(workspace: workspace)

        if result.success?
          Rails.logger.info("[WorkspaceLearnerJob] Suggestion generated for workspace #{workspace.id}")
        else
          Rails.logger.warn("[WorkspaceLearnerJob] Failed for workspace #{workspace.id}: #{result.error}")
        end
      rescue StandardError => e
        Rails.logger.error("[WorkspaceLearnerJob] failed for workspace #{workspace.id}: #{e.message}")
      end
    end
  end
end
