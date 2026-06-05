# frozen_string_literal: true

class PatternDetectorJob < ApplicationJob
  queue_as :ai_processing

  def perform
    Workspace.active.find_each do |workspace|
      Ai::PatternDetector.call(workspace: workspace)
    rescue StandardError => e
      Rails.logger.error("PatternDetectorJob failed for workspace #{workspace.id}: #{e.message}")
    end
  end
end
