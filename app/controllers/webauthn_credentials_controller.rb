# frozen_string_literal: true

class WebauthnCredentialsController < ApplicationController
  def index
    authorize WebauthnCredential
    credentials = policy_scope(WebauthnCredential).recently_used

    render inertia: 'Settings/Passkeys/Index', props: {
      credentials: credentials.map { |c| serialize_credential(c) }
    }
  end

  def destroy
    credential = WebauthnCredential.find(params.expect(:id))
    authorize credential

    result = Webauthn::RevokeCredential.call(credential: credential, revoked_by: current_user, request: request)

    if result.failure?
      redirect_back_or_to webauthn_credentials_path, alert: 'Could not remove passkey'
      return
    end

    redirect_back_or_to webauthn_credentials_path, notice: 'Passkey removed'
  end

  private

  def serialize_credential(credential)
    {
      id: credential.id,
      nickname: credential.nickname,
      last_used_at: credential.last_used_at,
      created_at: credential.created_at
    }
  end
end
