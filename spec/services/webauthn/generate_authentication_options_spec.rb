# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Webauthn::GenerateAuthenticationOptions do
  let!(:workspace) { create(:workspace) }
  let!(:user)      { create(:user, workspace: workspace) }
  let!(:credential) { create(:webauthn_credential, user: user, workspace: workspace) }

  describe '.call' do
    it 'returns success with a challenge for a known email' do
      result = described_class.call(email: user.email)

      expect(result).to be_success
      expect(result.data.challenge).to be_present
    end

    it 'returns success with a challenge for an unknown email' do
      result = described_class.call(email: 'nobody@example.com')

      expect(result).to be_success
      expect(result.data.challenge).to be_present
    end

    it 'includes the registered credential in allowCredentials for a known user' do
      result = described_class.call(email: user.email)

      expect(result.data.allow).to include(credential.external_id)
    end

    it 'returns an empty allow list for an unknown email, shaped identically to a known one' do
      known_result   = described_class.call(email: user.email)
      unknown_result = described_class.call(email: 'nobody@example.com')

      expect(unknown_result.data.allow).to eq([])
      expect(known_result.data.allow).not_to eq([])
      expect(unknown_result.data.class).to eq(known_result.data.class)
    end

    it 'requires user verification regardless of whether the user exists' do
      known_result   = described_class.call(email: user.email)
      unknown_result = described_class.call(email: 'nobody@example.com')

      expect(known_result.data.user_verification).to eq('required')
      expect(unknown_result.data.user_verification).to eq('required')
    end

    it 'returns failure when the underlying gem call raises' do
      allow(WebAuthn::Credential).to receive(:options_for_get).and_raise(StandardError, 'boom')

      result = described_class.call(email: user.email)

      expect(result).to be_failure
      expect(result.error).to eq('boom')
    end
  end
end
