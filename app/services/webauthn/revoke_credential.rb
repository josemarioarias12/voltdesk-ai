# frozen_string_literal: true

module Webauthn
  class RevokeCredential
    include ComplianceLoggable

    def self.call(**args) = new(**args).call

    def initialize(credential:, revoked_by:, request:)
      @credential = credential
      @revoked_by = revoked_by
      @request    = request
    end

    def call
      owner = @credential.user
      @credential.destroy!

      log_compliance_event(
        event_type: :webauthn_credential_revoked,
        resource: owner,
        actor: @revoked_by,
        workspace: owner.workspace,
        metadata: { nickname: @credential.nickname }
      )

      ServiceResult.success(nil)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    attr_reader :request
  end
end
