# frozen_string_literal: true

module Webauthn
  class RegistrationsController < ApplicationController
    before_action :authenticate_user!

    def new
      result = Webauthn::GenerateRegistrationOptions.call(user: current_user)

      if result.failure?
        render json: { error: result.error }, status: :unprocessable_content
        return
      end

      session[:webauthn_registration_challenge] = result.data.challenge
      render json: result.data
    end

    def create
      challenge = session.delete(:webauthn_registration_challenge)

      if challenge.blank?
        render json: { error: 'registration_session_expired' }, status: :unprocessable_content
        return
      end

      result = Webauthn::VerifyRegistration.call(
        user: current_user,
        challenge: challenge,
        credential_params: registration_params,
        nickname: params[:nickname]
      )

      if result.failure?
        render json: { error: result.error }, status: :unprocessable_content
        return
      end

      render json: { id: result.data.id, nickname: result.data.nickname }, status: :created
    end

    private

    def registration_params
      params.expect(credential: [:id, :rawId, :type, {
                      response: %i[clientDataJSON attestationObject], clientExtensionResults: {}
                    }])
    end
  end
end
