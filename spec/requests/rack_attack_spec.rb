# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Rack::Attack throttling', type: :request do
  # Each example group gets a unique IP prefix to avoid cross-example counter bleed.
  # Using object_id of the example group ensures no two examples share an IP
  # regardless of seed order or MemoryStore reset timing.
  IP_COUNTER = Concurrent::AtomicFixnum.new(1) # rubocop:disable Lint/ConstantDefinitionInBlock

  before(:each) do
    Rack::Attack.enabled = true
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  end

  after(:each) do
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
    Rack::Attack.enabled = false
  end

  describe 'throttle logins/ip' do
    let(:login_ip) { "10.1.#{IP_COUNTER.increment % 255}.#{IP_COUNTER.increment % 255}" }

    def post_login(times)
      times.times do
        post '/login',
             params: { user: { email: 'x@x.com', password: 'wrong' } },
             headers: { 'REMOTE_ADDR' => login_ip }
      end
    end

    it 'allows requests under the limit' do
      post_login(10)
      expect(response.status).not_to eq(429)
    end

    it 'blocks after 10 login attempts from same IP' do
      post_login(11)
      expect(response.status).to eq(429)
    end

    it 'includes Retry-After header on 429' do
      post_login(11)
      expect(response.headers['Retry-After']).to be_present
    end
  end

  describe 'throttle api/key' do
    let!(:workspace) { create(:workspace) }
    let!(:user)      { create(:user, workspace: workspace) }
    let!(:token)     { 'test_token_rack_attack_key' }
    let!(:digest)    { Digest::SHA256.hexdigest(token) }
    let!(:api_key)   { create(:api_key, workspace: workspace, user: user, key_digest: digest, scopes: ['tickets:read']) }

    it 'blocks after 100 requests per minute with same API key' do
      101.times do
        get '/api/v1/tickets', headers: { 'Authorization' => "Bearer #{token}" }
      end
      expect(response.status).to eq(429)
    end

    it 'returns JSON error body for API throttle' do
      101.times do
        get '/api/v1/tickets', headers: { 'Authorization' => "Bearer #{token}" }
      end
      body = response.parsed_body
      expect(body['code']).to eq('rate_limited')
      expect(body['status']).to eq(429)
    end

    it 'includes Retry-After header' do
      101.times do
        get '/api/v1/tickets', headers: { 'Authorization' => "Bearer #{token}" }
      end
      expect(response.headers['Retry-After']).to be_present
    end
  end

  describe 'throttle api/ip' do
    let!(:workspace) { create(:workspace) }
    let!(:user)      { create(:user, workspace: workspace) }
    let!(:token)     { 'test_token_rack_attack_ip' }
    let!(:digest)    { Digest::SHA256.hexdigest(token) }
    let!(:api_key)   { create(:api_key, workspace: workspace, user: user, key_digest: digest, scopes: ['tickets:read']) }

    it 'blocks after 300 requests from same IP' do
      301.times do
        get '/api/v1/tickets', headers: { 'Authorization' => "Bearer #{token}" }
      end
      expect(response.status).to eq(429)
    end
  end
end