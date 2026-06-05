# frozen_string_literal: true

class DashboardsController < ApplicationController
  def show
    authorize :dashboard, :show?
    result = Analytics::DashboardMetrics.call(user: current_user, workspace: current_workspace)

    render inertia: 'Dashboard/Show', props: { metrics: result.data }
  end
end
