require 'rails_helper'

RSpec.describe DemoModes::DeactivateDemo do
  let(:token) { SecureRandom.hex(32) }

  before { REDIS.flushdb }
  after  { REDIS.flushdb }

  describe '.call' do
    it 'removes token and count keys from Redis' do
      REDIS.set("demo_token:#{token}", 1, ex: 1800)
      REDIS.set("demo_count:#{token}", 5, ex: 1800)

      result = described_class.call(token: token)

      expect(result).to be_success
      expect(REDIS.exists?("demo_token:#{token}")).to eq(false)
      expect(REDIS.exists?("demo_count:#{token}")).to eq(false)
    end

    it 'succeeds even if keys do not exist' do
      result = described_class.call(token: token)

      expect(result).to be_success
    end
  end
end
