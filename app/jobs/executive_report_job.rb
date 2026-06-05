# frozen_string_literal: true

class ExecutiveReportJob < ApplicationJob
  queue_as :ai_processing

  def perform
    Workspace.active.find_each do |workspace|
      Ai::ExecutiveReportGenerator.call(workspace: workspace)
    rescue StandardError => e
      Rails.logger.error("ExecutiveReportJob failed for workspace #{workspace.id}: #{e.message}")
    end
  end
end
