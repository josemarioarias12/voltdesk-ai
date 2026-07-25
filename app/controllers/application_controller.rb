# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include Pundit::Authorization
  include ComplianceLoggable
  include SecureHeaders

  before_action :authenticate_user!
  before_action :verify_active_account!
  before_action :set_current_workspace
  before_action :set_current_user
  before_action :set_locale
  before_action :set_secure_headers

  inertia_share do
    {
      auth: {
        user: current_user ? serialize_user(current_user) : nil
      },
      workspace: current_workspace ? serialize_workspace(current_workspace) : nil,
      flash: {
        notice: flash[:notice],
        alert: flash[:alert]
      },
      notifications: current_user ? serialize_notifications(current_user) : [],
      unread_notifications_count: current_user ? current_user.notifications.unread.count : 0,
      active_tickets_count: active_tickets_count_for_nav,
      csp_nonce: content_security_policy_nonce,
      show_face_id_prompt: session.delete(:show_face_id_prompt) == true
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

  def set_locale
    I18n.locale = cookies[:voltdesk_locale].presence_in(I18n.available_locales.map(&:to_s)) || I18n.default_locale
  end

  def set_current_workspace
    Current.workspace = current_workspace
  end

  def after_sign_in_path_for(resource)
    session[:show_face_id_prompt] =
      resource.respond_to?(:webauthn_credentials) && !resource.webauthn_credentials.exists?
    super
  end

  def set_current_user
    Current.user = current_user
  end

  def verify_active_account!
    return unless current_user
    return if current_user.active?

    sign_out(current_user)
    redirect_to login_page_path, alert: t('errors.account_deactivated')
  end

  def handle_unauthorized
    redirect_back_or_to root_path, alert: t('errors.unauthorized')
  end

  # Generic 404 — never expose record ID or model name to prevent enumeration attacks
  def handle_not_found
    render inertia: 'errors/NotFound', props: { status: 404 }, status: :not_found
  end

  def active_tickets_count_for_nav
    return 0 unless current_user && current_workspace

    base = current_workspace.tickets.where(status: %w[open in_progress pending])

    case current_user.role
    when 'employee', 'guest'
      base.where(created_by: current_user).count
    when 'agent'
      base.where(assigned_to: current_user).count
    else
      base.count
    end
  end

  def serialize_user(user)
    {
      id:         user.id,
      email:      user.email,
      full_name:  user.full_name,
      first_name: user.first_name,
      last_name:  user.last_name,
      role:       user.role,
      active:     user.active,
      avatar_url: user.avatar.attached? ? url_for(user.avatar) : nil
    }
  end

  def serialize_workspace(workspace)
    {
      id:   workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan
    }
  end

  def serialize_notifications(user)
    user.notifications
        .recent
        .limit(20)
        .map do |ntf|
          {
            id:                ntf.id,
            title:             ntf.title,
            body:              ntf.body,
            notification_type: ntf.notification_type,
            resource_type:     ntf.resource_type,
            resource_id:       ntf.resource_id,
            read:              ntf.read,
            created_at:        ntf.created_at.iso8601
          }
        end
  end
end
