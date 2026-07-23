# frozen_string_literal: true

module Users
  class SessionsController < Devise::SessionsController
    def new
      render inertia: 'Auth/Login'
    end

    def create
      email    = params.dig(:user, :email)
      password = params.dig(:user, :password)

      resource = User.find_by(email: email)

      if resource&.valid_password?(password)
        sign_in(resource_name, resource)
        redirect_to after_sign_in_path_for(resource)
      else
        redirect_to login_page_path, alert: 'Invalid email or password.'
      end
    end
  end
end
