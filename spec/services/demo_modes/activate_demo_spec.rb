require 'rails_helper'

RSpec.describe DemoModes::ActivateDemo do
  let(:workspace) { create(:workspace) }

  before { REDIS.flushdb }
  after  { REDIS.flushdb }

  describe '.call' do
    it 'returns success with token and expires_in' do
      result = described_class.call(workspace: workspace)

      expect(result).to be_success
      expect(result.data[:token]).to be_a(String).and have_attributes(length: 64)
      expect(result.data[:expires_in]).to eq(1800)
    end

    it 'stores token in Redis with TTL' do
      result = described_class.call(workspace: workspace)
      token  = result.data[:token]

      expect(REDIS.get("demo_token:#{token}")).to eq(workspace.id.to_s)
      expect(REDIS.ttl("demo_token:#{token}")).to be_between(1, 1800)
    end

    it 'initializes guest count to 0' do
      result = described_class.call(workspace: workspace)
      token  = result.data[:token]

      expect(REDIS.get("demo_count:#{token}")).to eq('0')
    end
  end
end
