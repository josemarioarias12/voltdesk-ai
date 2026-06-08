# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DemoModes::GetStatus do
  let(:token) { SecureRandom.hex(32) }

  before { REDIS.flushdb }
  after  { REDIS.flushdb }

  describe '.call' do
    it 'returns failure :expired when token does not exist' do
      result = described_class.call(token: token)

      expect(result).to be_failure
      expect(result.error).to eq(:expired)
    end

    it 'returns expires_in and guest_count' do
      REDIS.set("demo_token:#{token}", 1, ex: 1800)
      REDIS.set("demo_count:#{token}", 7, ex: 1800)

      result = described_class.call(token: token)

      expect(result).to be_success
      expect(result.data[:guest_count]).to eq(7)
      expect(result.data[:expires_in]).to be_between(1, 1800)
    end
  end
end
