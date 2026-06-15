# frozen_string_literal: true

module Admin
  class ApiDashboardController < ApplicationController
    before_action :authenticate_user!

    def index
      authorize current_workspace, :manage_api_keys?
      result = Analytics::ApiMetrics.call(
        workspace: current_workspace,
        period:    params[:period] == '7d' ? 7.days : 24.hours
      )

      render inertia: 'Admin/ApiDashboard/Index', props: {
        metrics: result.success? ? result.data : {},
        period:  params[:period] || '24h'
      }
    end
  end
end
