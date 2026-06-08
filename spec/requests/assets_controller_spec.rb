# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AssetsController, type: :request do
  let(:workspace)   { create(:workspace) }
  let(:department)  { create(:department, workspace: workspace) }
  let(:it_manager)  { create(:user, workspace: workspace, role: :it_manager) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee) { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /inventory' do
    before { sign_in it_manager }

    it 'returns 200' do
      get assets_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'returns assets and summary props' do
      get assets_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']).to include('assets', 'summary')
    end
  end

  describe 'GET /inventory/new' do
    before { sign_in it_manager }

    it 'returns 200' do
      get new_asset_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'GET /inventory/:id' do
    let(:asset) { create(:asset, workspace: workspace, department: department) }

    before { sign_in it_manager }

    it 'returns 200' do
      get asset_path(asset), headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /inventory' do
    before { sign_in it_manager }

    let(:valid_params) do
      { asset: { name: 'MacBook Pro', asset_type: 'laptop', status: 'active',
                 department_id: department.id } }
    end

    it 'creates an asset' do
      expect { post assets_path, params: valid_params }.to change(Asset, :count).by(1)
    end

    it 'redirects after creation' do
      post assets_path, params: valid_params
      expect(response).to have_http_status(:redirect)
    end

    it 'redirects on invalid params' do
      post assets_path, params: { asset: { name: '' } }
      expect(response).to have_http_status(:redirect)
    end
  end

  describe 'PATCH /inventory/:id' do
    let(:asset) { create(:asset, workspace: workspace, name: 'Old Name') }

    before { sign_in it_manager }

    it 'updates and redirects' do
      patch asset_path(asset), params: { asset: { name: 'New Name' } }
      expect(response).to have_http_status(:redirect)
      expect(asset.reload.name).to eq('New Name')
    end
  end

  describe 'DELETE /inventory/:id' do
    let!(:asset) { create(:asset, workspace: workspace) }
    let(:ws_admin) { create(:user, workspace: workspace, role: :workspace_admin) }

    before { sign_in ws_admin }

    it 'destroys and redirects' do
      expect { delete asset_path(asset) }.to change(Asset, :count).by(-1)
      expect(response).to have_http_status(:redirect)
    end
  end

  describe 'authorization' do
    before { sign_in employee }

    it 'redirects employee away from assets' do
      get assets_path, headers: inertia_headers
      expect(response).to have_http_status(:redirect)
    end
  end
end
