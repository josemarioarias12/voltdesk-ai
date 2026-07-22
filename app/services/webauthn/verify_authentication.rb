# frozen_string_literal: true

module Webauthn
  class VerifyAuthentication
    def self.call(**args) = new(**args).call

    def initialize(challenge:, credential_params:)
      @challenge = challenge
      @credential_params = credential_params
    end

    def call
      return ServiceResult.failure('credential_not_found') unless stored_credential

      webauthn_credential = WebAuthn::Credential.from_get(@credential_params)
      webauthn_credential.verify(
        @challenge,
        public_key: stored_credential.public_key,
        sign_count: stored_credential.sign_count
      )

      stored_credential.update!(
        sign_count: webauthn_credential.sign_count,
        last_used_at: Time.current
      )

      ServiceResult.success(stored_credential.user)
    rescue WebAuthn::Error => e
      ServiceResult.failure("verification_failed: #{e.message}")
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def stored_credential
      return @stored_credential if defined?(@stored_credential)

      @stored_credential = WebauthnCredential.find_by(external_id: extracted_id)
    end

    def extracted_id
      @credential_params[:id] || @credential_params['id']
    end
  end
end
