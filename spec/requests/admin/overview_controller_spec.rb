# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::OverviewController, type: :request do
  let(:workspace)       { create(:workspace) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee)        { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /admin' do
    before { sign_in workspace_admin }

    it 'returns 200' do
      get admin_root_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'returns stats props' do
      get admin_root_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']['stats']).to include(
        'total_operations', 'total_cost_usd', 'success_rate'
      )
    end

    it 'redirects employee' do
      sign_in employee
      get admin_root_path, headers: inertia_headers
      expect(response).to have_http_status(:redirect)
    end
  end
end
