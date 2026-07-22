# frozen_string_literal: true

require 'rails_helper'
require 'webauthn/fake_client'

# rubocop:disable Rails/SaveBang -- fake_client.create is WebAuthn::FakeClient#create, not ActiveRecord

RSpec.describe Webauthn::VerifyAuthentication do
  let!(:workspace)  { create(:workspace) }
  let!(:user)       { create(:user, workspace: workspace) }
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

  def authentication_options
    WebAuthn::Credential.options_for_get(allow: [credential.external_id])
  end

  describe '.call' do
    it 'authenticates successfully and returns the owning user' do
      options = authentication_options
      auth_params = fake_client.get(challenge: options.challenge)

      result = described_class.call(challenge: options.challenge, credential_params: auth_params)

      expect(result).to be_success
      expect(result.data).to eq(user)
    end

    it 'updates last_used_at on successful authentication' do
      options = authentication_options
      auth_params = fake_client.get(challenge: options.challenge)

      expect { described_class.call(challenge: options.challenge, credential_params: auth_params) }
        .to change { credential.reload.last_used_at }.from(nil)
    end

    it 'fails when the credential id is unknown' do
      options = authentication_options
      auth_params = fake_client.get(challenge: options.challenge)
      auth_params['id'] = SecureRandom.uuid

      result = described_class.call(challenge: options.challenge, credential_params: auth_params)

      expect(result).to be_failure
      expect(result.error).to eq('credential_not_found')
    end

    it 'fails when the challenge does not match what was signed' do
      options = authentication_options
      auth_params = fake_client.get(challenge: options.challenge)
      different_options = authentication_options

      result = described_class.call(challenge: different_options.challenge, credential_params: auth_params)

      expect(result).to be_failure
      expect(result.error).to include('verification_failed')
    end
  end
  # rubocop:enable Rails/SaveBang
end
