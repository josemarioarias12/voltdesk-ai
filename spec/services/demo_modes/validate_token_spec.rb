require 'rails_helper'

RSpec.describe DemoModes::ValidateToken do
  let(:workspace) { create(:workspace) }
  let(:token)     { SecureRandom.hex(32) }

  before { REDIS.flushdb }
  after  { REDIS.flushdb }

  def seed_token(count: 0)
    REDIS.set("demo_token:#{token}", workspace.id, ex: 1800)
    REDIS.set("demo_count:#{token}", count, ex: 1800)
  end

  describe '.call' do
    it 'returns failure :expired when token does not exist' do
      result = described_class.call(token: token)

      expect(result).to be_failure
      expect(result.error).to eq(:expired)
    end

    it 'returns success with workspace and guest count' do
      seed_token

      result = described_class.call(token: token)

      expect(result).to be_success
      expect(result.data[:workspace]).to eq(workspace)
      expect(result.data[:guest_count]).to eq(1)
    end

    it 'increments guest count on each call' do
      seed_token(count: 3)

      result = described_class.call(token: token)

      expect(result.data[:guest_count]).to eq(4)
    end

    it 'returns failure :capacity_reached when at 50 guests' do
      seed_token(count: 50)

      result = described_class.call(token: token)

      expect(result).to be_failure
      expect(result.error).to eq(:capacity_reached)
    end

    it 'returns failure :workspace_not_found for unknown workspace id' do
      REDIS.set("demo_token:#{token}", 999_999, ex: 1800)
      REDIS.set("demo_count:#{token}", 0, ex: 1800)

      result = described_class.call(token: token)

      expect(result).to be_failure
      expect(result.error).to eq(:workspace_not_found)
    end
  end
end
