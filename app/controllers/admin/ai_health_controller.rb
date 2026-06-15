# frozen_string_literal: true

module Admin
  class AiHealthController < Admin::BaseController
    def index
      authorize :ai_health, :index?
      result = Analytics::AiHealthMetrics.new(
        workspace:   current_workspace,
        period_days: params.fetch(:period_days, 7).to_i
      ).call

      render inertia: 'Admin/AiHealth/Index', props: {
        metrics:     result.data,
        period_days: params.fetch(:period_days, 7).to_i
      }
    end
  end
end
