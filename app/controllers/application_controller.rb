# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include Pundit::Authorization

  before_action :authenticate_user!
  before_action :set_current_workspace
  before_action :set_current_user

  inertia_share do
    {
      auth: {
        user: current_user ? serialize_user(current_user) : nil
      },
      workspace: current_workspace ? serialize_workspace(current_workspace) : nil,
      flash: {
        notice: flash[:notice],
        alert: flash[:alert]
      }
    }
  end

  rescue_from Pundit::NotAuthorizedError, with: :handle_unauthorized
  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found

  protected

  def current_workspace
    @current_workspace ||= current_user&.workspace
  end
  helper_method :current_workspace

  private

  def set_current_workspace
    Current.workspace = current_workspace
  end

  def set_current_user
    Current.user = current_user
  end

  def handle_unauthorized
    redirect_back_or_to root_path, alert: t('errors.unauthorized')
  end

  def handle_not_found
    redirect_back_or_to root_path, alert: t('errors.not_found')
  end

  def serialize_user(user)
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      active: user.active
    }
  end

  def serialize_workspace(workspace)
    {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan
    }
  end
end
