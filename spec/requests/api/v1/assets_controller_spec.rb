# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Assets', type: :request do
  let!(:workspace)  { create(:workspace) }
  let!(:user)       { create(:user, workspace: workspace) }
  let(:token)      { SecureRandom.hex(32) }
  let(:digest)     { Digest::SHA256.hexdigest(token) }
  let!(:api_key) { create(:api_key, workspace: workspace, user: user, key_digest: digest, scopes: %w[assets:read]) }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }
  let!(:department) { create(:department, workspace: workspace) }

  describe 'GET /api/v1/assets' do
    before { create_list(:asset, 3, workspace: workspace, department: department) }

    context 'with valid API key' do
      it 'returns paginated assets' do
        api_key
        get '/api/v1/assets', headers: headers
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json['data']['assets'].length).to eq(3)
        expect(json['data']['meta']['total_count']).to eq(3)
      end

      it 'filters by asset_type' do
        api_key
        create(:asset, workspace: workspace, department: department, asset_type: 'laptop')
        get '/api/v1/assets', headers: headers, params: { asset_type: 'laptop' }
        json = response.parsed_body
        expect(json['data']['assets'].all? { |ast| ast['asset_type'] == 'laptop' }).to be true
      end

      it 'filters by risk_score_min' do
        api_key
        create(:asset, workspace: workspace, department: department, risk_score: 85.0)
        get '/api/v1/assets', headers: headers, params: { risk_score_min: 80 }
        json = response.parsed_body
        expect(json['data']['assets'].all? { |ast| ast['risk_score'].to_f >= 80 }).to be true
      end
    end

    context 'with invalid API key' do
      it 'returns 401' do
        get '/api/v1/assets', headers: { 'Authorization' => 'Bearer invalid' }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /api/v1/assets/:id' do
    let(:asset) { create(:asset, workspace: workspace, department: department) }

    context 'with valid API key' do
      it 'returns asset with warranty_status' do
        api_key
        get "/api/v1/assets/#{asset.id}", headers: headers
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json['data']['id']).to eq(asset.id)
        expect(json['data']).to have_key('warranty_status')
        expect(json['data']).to have_key('incident_count')
      end
    end

    context 'with invalid API key' do
      it 'returns 401' do
        get "/api/v1/assets/#{asset.id}", headers: { 'Authorization' => 'Bearer bad' }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    it 'returns 404 for asset from another workspace' do
      api_key
      other_asset = create(:asset, department: create(:department))
      get "/api/v1/assets/#{other_asset.id}", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end
end
