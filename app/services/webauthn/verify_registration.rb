# frozen_string_literal: true

module Webauthn
  class VerifyRegistration
    def self.call(**args) = new(**args).call

    def initialize(user:, challenge:, credential_params:, nickname: nil)
      @user = user
      @challenge = challenge
      @credential_params = credential_params
      @nickname = nickname
    end

    def call
      webauthn_credential = WebAuthn::Credential.from_create(@credential_params)
      webauthn_credential.verify(@challenge)

      credential = @user.webauthn_credentials.create!(
        workspace: @user.workspace,
        external_id: webauthn_credential.id,
        public_key: webauthn_credential.public_key,
        sign_count: webauthn_credential.sign_count,
        nickname: @nickname.presence || default_nickname,
        credential_type: :platform
      )

      ServiceResult.success(credential)
    rescue WebAuthn::Error => e
      ServiceResult.failure("verification_failed: #{e.message}")
    rescue ActiveRecord::RecordInvalid => e
      ServiceResult.failure(e.record.errors.full_messages.join(', '))
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def default_nickname
      "Passkey — #{Time.current.strftime('%b %d, %Y')}"
    end
  end
end
