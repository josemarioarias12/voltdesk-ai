# frozen_string_literal: true

class DashboardController < ApplicationController
  def index
    render inertia: 'Dashboard/Index'
  end
end
