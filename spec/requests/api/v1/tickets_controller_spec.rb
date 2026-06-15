# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Tickets', type: :request do
  let!(:workspace)  { create(:workspace) }
  let!(:user)       { create(:user, workspace: workspace) }
  let!(:token)      { SecureRandom.hex(32) }
  let!(:digest)     { Digest::SHA256.hexdigest(token) }
  let!(:api_key)   { create(:api_key, workspace: workspace, user: user, key_digest: digest) }
  let(:headers)    { { 'Authorization' => "Bearer #{token}" } }
  let!(:department) { create(:department, workspace: workspace) }

  describe 'GET /api/v1/tickets' do
    before { create_list(:ticket, 3, workspace: workspace, department: department, created_by: user) }

    context 'with valid API key' do
      it 'returns paginated tickets' do
        get '/api/v1/tickets', headers: headers
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json['data']['tickets'].length).to eq(3)
        expect(json['data']['meta']['total_count']).to eq(3)
      end

      it 'filters by status' do
        create(:ticket, workspace: workspace, department: department,
               created_by: user, status: :resolved)
        get '/api/v1/tickets', headers: headers, params: { status: 'resolved' }
        json = response.parsed_body
        expect(json['data']['tickets'].all? { |tkt| tkt['status'] == 'resolved' }).to be true
      end
    end

    context 'with invalid API key' do
      it 'returns 401' do
        get '/api/v1/tickets', headers: { 'Authorization' => 'Bearer invalid_token' }
        expect(response).to have_http_status(:unauthorized)
        json = response.parsed_body
        expect(json['code']).to eq('unauthorized')
      end
    end

    context 'without Authorization header' do
      it 'returns 401' do
        get '/api/v1/tickets'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /api/v1/tickets/:id' do
    let(:ticket) { create(:ticket, workspace: workspace, department: department, created_by: user) }

    it 'returns ticket details with ai_metadata' do
      get "/api/v1/tickets/#{ticket.id}", headers: headers
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json['data']['id']).to eq(ticket.id)
      expect(json['data']).to have_key('ai_metadata')
      expect(json['data']).to have_key('sla_status')
    end

    it 'returns 404 for ticket from another workspace' do
      other_ticket = create(:ticket, department: create(:department))
      get "/api/v1/tickets/#{other_ticket.id}", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/tickets' do
    let(:valid_params) do
      {
        ticket: {
          title:         'VPN not working',
          description:   'Cannot connect to VPN since this morning',
          priority:      'high',
          department_id: department.id
        }
      }
    end

    context 'with valid params and API key' do
      it 'creates ticket and enqueues ClassifyTicketJob' do
        expect do
          post '/api/v1/tickets', headers: headers, params: valid_params, as: :json
        end.to have_enqueued_job(Ai::ClassifyTicketJob)
        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json['data']['title']).to eq('VPN not working')
      end
    end

    context 'with invalid API key' do
      it 'returns 401 and does not create ticket' do
        expect do
          post '/api/v1/tickets',
               headers: { 'Authorization' => 'Bearer bad_token' },
               params: valid_params, as: :json
        end.not_to change(Ticket, :count)
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
