# frozen_string_literal: true

require 'rails_helper'
require 'webauthn/fake_client'
# rubocop:disable Rails/SaveBang -- fake_client.create is WebAuthn::FakeClient#create, not ActiveRecord

RSpec.describe Webauthn::VerifyRegistration do
  let!(:workspace)   { create(:workspace) }
  let!(:user)        { create(:user, workspace: workspace) }
  let(:fake_client)  { WebAuthn::FakeClient.new('http://localhost:3000') }

  def registration_options
    WebAuthn::Credential.options_for_create(
      user: { id: user.webauthn_id, name: user.email, display_name: user.first_name }
    )
  end

  describe '.call' do
    it 'creates a webauthn credential when the ceremony is valid' do
      options = registration_options
      credential_params = fake_client.create(challenge: options.challenge)

      result = described_class.call(user: user, challenge: options.challenge, credential_params: credential_params)

      expect(result).to be_success
      expect(result.data).to be_a(WebauthnCredential)
      expect(result.data.user).to eq(user)
      expect(result.data.workspace).to eq(workspace)
      expect(result.data.credential_type_platform?).to be true
    end

    it 'stores the initial sign_count reported by the authenticator' do
      options = registration_options
      credential_params = fake_client.create(challenge: options.challenge)

      result = described_class.call(user: user, challenge: options.challenge, credential_params: credential_params)

      expect(result.data.sign_count).to eq(0)
    end

    it 'fails when the challenge does not match what was signed' do
      options = registration_options
      credential_params = fake_client.create(challenge: options.challenge)
      different_challenge = registration_options.challenge

      result = described_class.call(
        user: user,
        challenge: different_challenge,
        credential_params: credential_params
      )

      expect(result).to be_failure
      expect(result.error).to include('verification_failed')
    end

    it 'fails when a credential with the same external_id already exists' do
      options = registration_options
      credential_params = fake_client.create(challenge: options.challenge)

      create(:webauthn_credential, user: user, workspace: workspace, external_id: credential_params['id'])

      result = described_class.call(user: user, challenge: options.challenge, credential_params: credential_params)

      expect(result).to be_failure
    end

    it 'uses the provided nickname, falling back to a default' do
      options = registration_options
      credential_params = fake_client.create(challenge: options.challenge)

      result = described_class.call(
        user: user,
        challenge: options.challenge,
        credential_params: credential_params,
        nickname: 'iPhone de Jose Mario'
      )

      expect(result.data.nickname).to eq('iPhone de Jose Mario')
    end
  end
  # rubocop:enable Rails/SaveBang
end
