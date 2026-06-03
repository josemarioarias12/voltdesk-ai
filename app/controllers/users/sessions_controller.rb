# frozen_string_literal: true
module Users
  class SessionsController < Devise::SessionsController
    skip_before_action :verify_authenticity_token, only: :create

    def new
      render inertia: 'Auth/Login'
    end

    def create
      Rails.logger.info "=== LOGIN PARAMS: #{params.inspect}"
      email    = params.dig(:user, :email) || params[:email]
      password = params.dig(:user, :password) || params[:password]
      Rails.logger.info "=== EMAIL: #{email}, PASSWORD present: #{password.present?}"

      resource = User.find_by(email: email)

      if resource&.valid_password?(password)
        sign_in(resource_name, resource)
        redirect_to root_path
      else
        redirect_to login_page_path, alert: 'Invalid email or password.'
      end
    end
  end
end
