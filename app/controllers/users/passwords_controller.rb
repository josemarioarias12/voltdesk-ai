# frozen_string_literal: true

module Users
  class PasswordsController < Devise::PasswordsController
    def new
      render inertia: 'Auth/ForgotPassword'
    end

    def edit
      render inertia: 'Auth/ResetPassword', props: {
        reset_password_token: params[:reset_password_token]
      }
    end

    def create
      self.resource = resource_class.send_reset_password_instructions(resource_params)

      if successfully_sent?(resource)
        redirect_to login_page_path, notice: t('devise.passwords.send_instructions')
      else
        redirect_to forgot_password_page_path, alert: resource.errors.full_messages.join(', ')
      end
    end

    def update
      self.resource = resource_class.reset_password_by_token(resource_params)

      if resource.errors.empty?
        sign_in(resource_name, resource)
        redirect_to root_path, notice: t('devise.passwords.updated')
      else
        redirect_to edit_user_password_path(reset_password_token: resource_params[:reset_password_token]),
                    alert: resource.errors.full_messages.join(', ')
      end
    end
  end
end
