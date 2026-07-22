# frozen_string_literal: true

module Webauthn
  class GenerateAuthenticationOptions
    def self.call(**args) = new(**args).call

    def initialize(email:)
      @email = email
    end

    def call
      allowed_external_ids = user&.webauthn_credentials&.pluck(:external_id) || []

      options = WebAuthn::Credential.options_for_get(
        allow: allowed_external_ids,
        user_verification: 'required'
      )

      ServiceResult.success(options)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def user
      return @user if defined?(@user)

      @user = User.find_by(email: @email)
    end
  end
end
