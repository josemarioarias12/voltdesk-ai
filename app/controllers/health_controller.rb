# frozen_string_literal: true

class HealthController < ApplicationController
  skip_before_action :authenticate_user!
  skip_before_action :set_current_workspace
  skip_before_action :set_current_user

  def index
    db_ok      = ActiveRecord::Base.connection.execute('SELECT 1').any?
    redis_ok   = REDIS.ping == 'PONG'
    sidekiq_ok = Sidekiq::ProcessSet.new.size >= 0

    render json: {
      status:  'ok',
      db:      db_ok ? 'connected' : 'error',
      redis:   redis_ok ? 'connected' : 'error',
      sidekiq: sidekiq_ok ? 'running' : 'stopped',
      version: ENV.fetch('GIT_SHA', 'dev')
    }
  rescue StandardError => e
    render json: { status: 'error', message: e.message }, status: :service_unavailable
  end
end
