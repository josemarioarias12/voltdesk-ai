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

  describe 'throttle demo/join/ip' do
    let(:request_ip) { unique_ip }

    def join_demo(times, headers: {})
      freeze_time do
        times.times do
          get '/demo/nonexistent-token', headers: headers.merge('REMOTE_ADDR' => request_ip)
        end
      end
    end

    it 'allows requests under the limit' do
      join_demo(10)
      expect(response.status).not_to eq(302)
    end

    it 'redirects to rate_limited page after 10 requests from same IP' do
      join_demo(11)
      expect(response.status).to eq(302)
      expect(response.headers['Location']).to include('/demo/rate_limited')
    end

    it 'returns Inertia-aware 409 with X-Inertia-Location for Inertia requests' do
      join_demo(11, headers: { 'X-Inertia' => 'true' })
      expect(response.status).to eq(409)
      expect(response.headers['X-Inertia-Location']).to eq('/demo/rate_limited')
    end
  end

  describe 'throttle demo/ticket/ip' do
    let(:request_ip) { unique_ip }

    def create_demo_ticket(times, headers: {})
      freeze_time do
        times.times do
          post '/demo/ticket',
               params: { ticket: { title: 'Test', description: 'Test desc' } },
               headers: headers.merge('REMOTE_ADDR' => request_ip)
        end
      end
    end

    it 'allows requests under the limit' do
      create_demo_ticket(5)
      expect(response.headers['Location']).not_to include('/demo/rate_limited')
    end

    it 'redirects to rate_limited page after 5 requests from same IP' do
      create_demo_ticket(6)
      expect(response.status).to eq(302)
      expect(response.headers['Location']).to include('/demo/rate_limited')
    end

    it 'returns Inertia-aware 409 with X-Inertia-Location for Inertia requests' do
      create_demo_ticket(6, headers: { 'X-Inertia' => 'true' })
      expect(response.status).to eq(409)
      expect(response.headers['X-Inertia-Location']).to eq('/demo/rate_limited')
    end
  end

  describe 'throttle webauthn/authentication/ip' do
    let(:request_ip) { unique_ip }

    def request_options(times)
      freeze_time do
        times.times do |i|
          post '/webauthn/authentication/options',
               params: { email: "user#{i}@example.com" }.to_json,
               headers: { 'REMOTE_ADDR' => request_ip, 'Content-Type' => 'application/json' }
        end
      end
    end

    it 'allows requests under the limit' do
      request_options(10)
      expect(response.status).not_to eq(429)
    end

    it 'blocks after 10 attempts from the same IP' do
      request_options(11)
      expect(response.status).to eq(429)
    end
  end

  describe 'throttle webauthn/authentication/email' do
    def request_options_for_target(times)
      freeze_time do
        times.times do
          post '/webauthn/authentication/options',
               params: { email: 'target@example.com' }.to_json,
               headers: { 'REMOTE_ADDR' => unique_ip, 'Content-Type' => 'application/json' }
        end
      end
    end

    it 'allows requests under the limit' do
      request_options_for_target(5)
      expect(response.status).not_to eq(429)
    end

    it 'blocks after 5 attempts against the same email, even from rotating IPs' do
      request_options_for_target(6)
      expect(response.status).to eq(429)
    end
  end

  describe 'throttle webauthn/registration/user' do
    let!(:workspace) { create(:workspace) }
    let!(:user)      { create(:user, workspace: workspace) }
    let(:request_ip) { unique_ip }

    before { sign_in user }

    def post_registration(times)
      freeze_time do
        times.times do
          post '/webauthn/registration',
               params: { credential: { id: 'x', rawId: 'x', type: 'public-key' } }.to_json,
               headers: { 'REMOTE_ADDR' => request_ip, 'Content-Type' => 'application/json' }
        end
      end
    end

    it 'allows requests under the limit' do
      post_registration(10)
      expect(response.status).not_to eq(429)
    end

    it 'blocks after 10 attempts from the same authenticated user' do
      post_registration(11)
      expect(response.status).to eq(429)
    end
  end
end
