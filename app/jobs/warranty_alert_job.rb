# frozen_string_literal: true

class WarrantyAlertJob < ApplicationJob
  queue_as :default

  def perform
    Workspace.active.find_each do |workspace|
      result = It::WarrantyAlertService.call(workspace: workspace)

      if result.success?
        Rails.logger.info("[WarrantyAlertJob] workspace=#{workspace.slug} alerts_sent=#{result.data[:alerts_sent]}")
      end
      Rails.logger.error("[WarrantyAlertJob] workspace=#{workspace.slug} error=#{result.error}") if result.failure?
    end
  end
end
