# frozen_string_literal: true

module Users
  class SessionsController < Devise::SessionsController
    def new
      render inertia: 'Auth/Login'
    end

    def create
      self.resource = warden.authenticate!(auth_options)
      sign_in(resource_name, resource)
      redirect_to root_path
    rescue Warden::NotAuthenticated
      redirect_to login_page_path, alert: t('devise.failure.invalid', authentication_keys: 'email')
    end
  end
end
