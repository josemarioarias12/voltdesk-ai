# frozen_string_literal: true

require 'rails_helper'
require 'webauthn/fake_client'

# rubocop:disable Rails/SaveBang -- fake_client.create is WebAuthn::FakeClient#create, not ActiveRecord

RSpec.describe Webauthn::SessionsController, type: :request do
  let!(:workspace)  { create(:workspace) }
  let!(:user)       { create(:user, workspace: workspace, role: :employee) }
  let(:fake_client) { WebAuthn::FakeClient.new('http://localhost:3000') }

  let!(:credential) do
    registration_options = WebAuthn::Credential.options_for_create(
      user: { id: user.webauthn_id, name: user.email, display_name: user.first_name }
    )
    credential_params = fake_client.create(challenge: registration_options.challenge)

    Webauthn::VerifyRegistration.call(
      user: user,
      challenge: registration_options.challenge,
      credential_params: credential_params
    ).data
  end

  describe 'POST /webauthn/authentication/options' do
    it 'returns options for a known email' do
      post webauthn_authentication_options_path, params: { email: user.email }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['challenge']).to be_present
    end

    it 'returns an identically shaped response for an unknown email' do
      post webauthn_authentication_options_path, params: { email: 'nobody@example.com' }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['challenge']).to be_present
      expect(body['allowCredentials']).to eq([])
    end
  end

  describe 'POST /webauthn/authentication/verify' do
    it 'signs the user in and logs a compliance event on success' do
      credential

      post webauthn_authentication_options_path, params: { email: user.email }
      challenge = response.parsed_body['challenge']
      auth_params = fake_client.get(challenge: challenge)

      expect do
        post webauthn_authentication_verify_path, params: { credential: auth_params }, as: :json
      end.to change(ComplianceLog, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(ComplianceLog.last.event_type_webauthn_authentication_succeeded?).to be true
      expect(ComplianceLog.last.actor).to eq(user)
    end

    it 'logs a failed compliance event and does not sign in when verification fails' do
      credential

      post webauthn_authentication_options_path, params: { email: user.email }
      auth_params = fake_client.get(challenge: WebAuthn::Credential.options_for_get.challenge)

      expect do
        post webauthn_authentication_verify_path, params: { credential: auth_params }, as: :json
      end.to change(ComplianceLog, :count).by(1)

      expect(response).to have_http_status(:unprocessable_content)
      expect(ComplianceLog.last.event_type_webauthn_authentication_failed?).to be true
    end
  end

  delegate :external_id, to: :credential, prefix: true
  # rubocop:enable Rails/SaveBang
end
