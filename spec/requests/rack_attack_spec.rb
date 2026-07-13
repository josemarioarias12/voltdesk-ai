# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Rack::Attack throttling', type: :request do
  include ActiveSupport::Testing::TimeHelpers

  # Each example gets a unique IP and API token to avoid cross-example counter
  # bleed. Using a shared atomic counter ensures no two examples share a
  # discriminator regardless of seed order or store reset timing.
  IP_COUNTER = Concurrent::AtomicFixnum.new(1) # rubocop:disable Lint/ConstantDefinitionInBlock, RSpec/LeakyConstantDeclaration

  before do
    Rack::Attack.enabled = true
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  end

  after do
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
    Rack::Attack.enabled = false
  end

  def unique_ip
    "10.1.#{IP_COUNTER.increment % 255}.#{IP_COUNTER.increment % 255}"
  end

  describe 'throttle logins/ip' do
    let(:login_ip) { unique_ip }

    # Frozen so a burst of rapid requests can never straddle Rack::Attack's
    # 60-second throttle bucket boundary under slow full-suite load.
    def post_login(times)
      freeze_time do
        times.times do
          post '/login',
               params: { user: { email: 'x@x.com', password: 'wrong' } },
               headers: { 'REMOTE_ADDR' => login_ip }
        end
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
    let(:token)      { "test_token_rack_attack_key_#{IP_COUNTER.increment}" }
    let!(:digest)    { Digest::SHA256.hexdigest(token) }
    let!(:api_key)   { create(:api_key, workspace: workspace, user: user, key_digest: digest, scopes: ['tickets:read']) }
    let(:request_ip) { unique_ip }

    def get_tickets(times)
      freeze_time do
        times.times do
          get '/api/v1/tickets',
              headers: { 'Authorization' => "Bearer #{token}", 'REMOTE_ADDR' => request_ip }
        end
      end
    end

    it 'blocks after 100 requests per minute with same API key' do
      get_tickets(101)
      expect(response.status).to eq(429)
    end

    it 'returns JSON error body for API throttle' do
      get_tickets(101)
      body = response.parsed_body
      expect(body['code']).to eq('rate_limited')
      expect(body['status']).to eq(429)
    end

    it 'includes Retry-After header' do
      get_tickets(101)
      expect(response.headers['Retry-After']).to be_present
    end
  end

  describe 'throttle api/ip' do
    let!(:workspace) { create(:workspace) }
    let!(:user)      { create(:user, workspace: workspace) }
    let(:token)      { "test_token_rack_attack_ip_#{IP_COUNTER.increment}" }
    let!(:digest)    { Digest::SHA256.hexdigest(token) }
    let!(:api_key)   { create(:api_key, workspace: workspace, user: user, key_digest: digest, scopes: ['tickets:read']) }
    let(:request_ip) { unique_ip }

    it 'blocks after 300 requests from same IP' do
      freeze_time do
        301.times do
          get '/api/v1/tickets',
              headers: { 'Authorization' => "Bearer #{token}", 'REMOTE_ADDR' => request_ip }
        end
      end
      expect(response.status).to eq(429)
    end
  end
end
