# frozen_string_literal: true

module Ai
  class WorkspaceLearnerJob < ApplicationJob
    queue_as :default
    sidekiq_options retry: 3

    def perform(workspace_id)
      workspace = Workspace.find(workspace_id)
      result = Ai::WorkspaceLearner.call(workspace: workspace)

      if result.success?
        Rails.logger.info("[WorkspaceLearnerJob] Suggestion generated for workspace #{workspace_id}")
      else
        Rails.logger.warn("[WorkspaceLearnerJob] Failed for workspace #{workspace_id}: #{result.error}")
      end
    end
  end
end
