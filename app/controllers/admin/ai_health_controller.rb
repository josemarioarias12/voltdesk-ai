# frozen_string_literal: true

module Admin
  class AiHealthController < Admin::BaseController
    def index
      authorize :ai_health, :index?
      period_days = params.fetch(:period_days, 7).to_i

      metrics = Rails.cache.fetch("workspace_#{current_workspace.id}_ai_health_#{period_days}",
                                  expires_in: 5.minutes) do
        Analytics::AiHealthMetrics.new(workspace: current_workspace, period_days: period_days).call.data
      end

      render inertia: 'Admin/AiHealth/Index', props: { metrics: metrics, period_days: period_days }
    end
  end
end
