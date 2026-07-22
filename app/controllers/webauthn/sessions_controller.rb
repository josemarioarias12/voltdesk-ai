# frozen_string_literal: true

module Webauthn
  class SessionsController < ApplicationController
    include ComplianceLoggable

    skip_before_action :authenticate_user!, raise: false

    def options
      result = Webauthn::GenerateAuthenticationOptions.call(email: params[:email])

      if result.failure?
        render json: { error: 'authentication_unavailable' }, status: :unprocessable_content
        return
      end

      session[:webauthn_authentication_challenge] = result.data.challenge
      session[:webauthn_authentication_user_id] = User.find_by(email: params[:email])&.id

      render json: result.data
    end

    def verify
      challenge = session.delete(:webauthn_authentication_challenge)
      attempted_user_id = session.delete(:webauthn_authentication_user_id)

      if challenge.blank?
        render json: { error: 'authentication_failed' }, status: :unprocessable_content
        return
      end

      result = Webauthn::VerifyAuthentication.call(challenge: challenge, credential_params: verification_params)

      if result.failure?
        log_failed_attempt(attempted_user_id)
        render json: { error: 'authentication_failed' }, status: :unprocessable_content
        return
      end

      sign_in(result.data)
      log_successful_attempt(result.data)

      render json: { redirect_to: after_sign_in_path_for(result.data) }
    end

    private

    def verification_params
      params.expect(credential: [:id, :rawId, :type, {
                      response: %i[clientDataJSON authenticatorData signature userHandle], clientExtensionResults: {}
                    }])
    end

    def log_successful_attempt(user)
      log_compliance_event(
        event_type: :webauthn_authentication_succeeded,
        resource: user,
        actor: user,
        workspace: user.workspace,
        metadata: { ip_address: request.remote_ip }
      )
    end

    def log_failed_attempt(user_id)
      return if user_id.blank?

      user = User.find_by(id: user_id)
      return unless user

      log_compliance_event(
        event_type: :webauthn_authentication_failed,
        resource: user,
        actor: user,
        workspace: user.workspace,
        metadata: { ip_address: request.remote_ip }
      )
    end
  end
end
