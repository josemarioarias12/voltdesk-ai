# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Webauthn::GenerateRegistrationOptions do
  let!(:workspace) { create(:workspace) }
  let!(:user)      { create(:user, workspace: workspace) }

  describe '.call' do
    it 'returns success with valid creation options' do
      result = described_class.call(user: user)

      expect(result).to be_success
      expect(result.data.challenge).to be_present
    end

    it 'sets the user handle to the opaque webauthn_id, never the raw user id or email' do
      result = described_class.call(user: user)

      expect(result.data.user.id).to eq(user.webauthn_id)
    end

    it 'forces platform authenticator with required user verification' do
      result = described_class.call(user: user)

      selection = result.data.authenticator_selection
      expect(selection[:authenticator_attachment]).to eq('platform')
      expect(selection[:user_verification]).to eq('required')
    end

    it 'excludes credentials the user already registered' do
      existing = create(:webauthn_credential, user: user, workspace: workspace)

      result = described_class.call(user: user)
      excluded_ids = result.data.exclude_credentials.pluck(:id)

      expect(excluded_ids).to include(existing.external_id)
    end

    it 'returns failure when the underlying gem call raises' do
      allow(WebAuthn::Credential).to receive(:options_for_create).and_raise(StandardError, 'boom')

      result = described_class.call(user: user)

      expect(result).to be_failure
      expect(result.error).to eq('boom')
    end
  end
end
