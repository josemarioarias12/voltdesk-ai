# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Workspace isolation', type: :request do
  let!(:workspace_a)    { create(:workspace) }
  let!(:user_a)         { create(:user, workspace: workspace_a, role: :agent) }
  let!(:dept_a)         { create(:department, workspace: workspace_a) }
  let!(:ticket_a)       { create(:ticket, workspace: workspace_a, department: dept_a, created_by: user_a) }
  let!(:asset_a)        { create(:asset, workspace: workspace_a) }

  let!(:workspace_b)    { create(:workspace) }
  let!(:user_b)         { create(:user, workspace: workspace_b, role: :agent) }
  let!(:dept_b)         { create(:department, workspace: workspace_b) }
  let!(:ticket_b)       { create(:ticket, workspace: workspace_b, department: dept_b, created_by: user_b) }
  let!(:asset_b)        { create(:asset, workspace: workspace_b) }

  let(:token_a)         { 'isolation_test_token_workspace_a' }
  let(:digest_a)        { Digest::SHA256.hexdigest(token_a) }
  let!(:api_key_a)      { create(:api_key, workspace: workspace_a, user: user_a, key_digest: digest_a, scopes: %w[tickets:read assets:read tickets:create]) }

  let(:revoked_token)   { 'isolation_test_revoked_token' }
  let(:revoked_digest)  { Digest::SHA256.hexdigest(revoked_token) }
  let!(:revoked_key)    { create(:api_key, workspace: workspace_a, user: user_a, key_digest: revoked_digest, active: false, scopes: ['tickets:read']) }

  describe 'Web session isolation' do
    before { sign_in user_a }

    it 'returns 404 when user_a accesses ticket from workspace_b' do
      get "/tickets/#{ticket_b.id}", headers: inertia_headers
      expect(response.status).to eq(404)
    end

    it 'returns 404 when user_a accesses department from workspace_b' do
      get "/departments/#{dept_b.id}", headers: inertia_headers
      expect(response.status).to eq(404)
    end

    it 'returns 404 when user_a accesses asset from workspace_b' do
      get "/assets/#{asset_b.id}", headers: inertia_headers
      expect(response.status).to eq(404)
    end

    it 'returns 404 for sequential ID enumeration on tickets' do
      ids = ((ticket_b.id - 2)..(ticket_b.id + 2)).to_a - [ticket_a.id]
      ids.each do |id|
        get "/tickets/#{id}", headers: inertia_headers
        expect(response.status).to eq(404) if id == ticket_b.id
      end
    end
  end

  describe 'Role-based access control' do
    it 'returns 302 or 403 when employee accesses admin' do
      employee = create(:user, workspace: workspace_a, role: :employee)
      sign_in employee
      get '/admin', headers: inertia_headers
      expect(response.status).to be_in([302, 403])
    end
  end

  describe 'API key workspace isolation' do
    it 'returns 404 when api_key_a accesses ticket from workspace_b' do
      get "/api/v1/tickets/#{ticket_b.id}",
          headers: { 'Authorization' => "Bearer #{token_a}" }
      expect(response.status).to eq(404)
    end

    it 'returns 404 when api_key_a accesses asset from workspace_b' do
      get "/api/v1/assets/#{asset_b.id}",
          headers: { 'Authorization' => "Bearer #{token_a}" }
      expect(response.status).to eq(404)
    end

    it 'does not expose record ID in 404 response body' do
      get "/api/v1/tickets/#{ticket_b.id}",
          headers: { 'Authorization' => "Bearer #{token_a}" }
      expect(response.body).not_to include(ticket_b.id.to_s)
      expect(response.body).not_to include("Couldn't find")
    end

    it 'returns 404 for enumeration of sequential IDs from other workspace' do
      ids = [ticket_b.id - 1, ticket_b.id, ticket_b.id + 1]
      ids.each do |id|
        get "/api/v1/tickets/#{id}",
            headers: { 'Authorization' => "Bearer #{token_a}" }
        next if id == ticket_a.id

        expect(response.status).to eq(404)
      end
    end
  end

  describe 'Scope enforcement' do
    let(:read_only_token)  { 'isolation_read_only_token' }
    let(:read_only_digest) { Digest::SHA256.hexdigest(read_only_token) }
    let!(:read_only_key)   { create(:api_key, workspace: workspace_a, user: user_a, key_digest: read_only_digest, scopes: ['tickets:read']) }

    it 'returns 403 when tickets:read token attempts POST /api/v1/tickets' do
      post '/api/v1/tickets',
           params: { ticket: { title: 'Test', description: 'Test', priority: 'medium', department_id: dept_a.id } },
           headers: { 'Authorization' => "Bearer #{read_only_token}", 'Content-Type' => 'application/json' }
      expect(response.status).to eq(403)
      body = response.parsed_body
      expect(body['code']).to eq('forbidden_scope')
    end
  end

  describe 'Revoked token enforcement' do
    it 'returns 401 immediately when using a revoked token' do
      get '/api/v1/tickets',
          headers: { 'Authorization' => "Bearer #{revoked_token}" }
      expect(response.status).to eq(401)
    end
  end
end
