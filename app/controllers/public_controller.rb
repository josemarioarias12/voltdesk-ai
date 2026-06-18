# frozen_string_literal: true

class PublicController < ActionController::Base
  include ActionController::Cookies
  include ActionController::RequestForgeryProtection

  layout 'application'

  def landing
    redirect_to dashboard_path and return if session[:user_id] || warden_user

    render inertia: 'Home/Index'
  end

  private

  def warden_user
    request.env['warden']&.user
  end
end
