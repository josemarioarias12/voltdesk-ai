# frozen_string_literal: true

module Ai
  class OperationalIntelligenceBriefJob < ApplicationJob
    queue_as :default
    sidekiq_options retry: 3

    def perform(workspace_id)
      workspace = Workspace.find(workspace_id)
      result = Ai::OperationalIntelligenceService.call(workspace: workspace, period: 90.days)

      if result.success?
        send_to_telegram(result.data)
        Rails.logger.info("[OperationalIntelligenceBriefJob] Sent for workspace #{workspace_id}")
      else
        Rails.logger.warn("[OperationalIntelligenceBriefJob] Failed for workspace #{workspace_id}: #{result.error}")
      end
    end

    private

    def send_to_telegram(data)
      prediction = data[:predictions]&.first
      message = if prediction
                  "#{prediction[:message]} — #{prediction[:recommendation]}"
                else
                  data[:summary].to_s
                end
      TelegramNotifier.send_prediction(message: message, level: :info)
    end
  end
end
