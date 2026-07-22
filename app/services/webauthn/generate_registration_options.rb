# frozen_string_literal: true

module Webauthn
  class GenerateRegistrationOptions
    def self.call(**args) = new(**args).call

    def initialize(user:)
      @user = user
    end

    def call
      options = WebAuthn::Credential.options_for_create(
        user: {
          id: @user.webauthn_id,
          name: @user.email,
          display_name: "#{@user.first_name} #{@user.last_name}"
        },
        exclude: @user.webauthn_credentials.pluck(:external_id),
        authenticator_selection: {
          authenticator_attachment: 'platform',
          user_verification: 'required',
          resident_key: 'discouraged'
        }
      )

      ServiceResult.success(options)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end
  end
end
