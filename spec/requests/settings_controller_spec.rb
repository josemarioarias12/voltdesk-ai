# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SettingsController, type: :request do
  let(:workspace)       { create(:workspace) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee)        { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /settings' do
    before { sign_in workspace_admin }

    it 'returns 200' do
      get settings_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'returns workspace, provider_models, and cost_table props' do
      get settings_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']).to include('workspace', 'provider_models', 'cost_table')
    end

    it 'redirects employee' do
      sign_in employee
      get settings_path, headers: inertia_headers
      expect(response).to have_http_status(:redirect)
    end
  end

  describe 'PATCH /settings/ai' do
    before { sign_in workspace_admin }

    let(:valid_params) do
      { workspace: { ai_provider: 'openai', ai_model: 'gpt-4o',
                     ai_fallback_provider: 'anthropic', ai_selection_mode: 'automatic' } }
    end

    it 'updates AI config and redirects' do
      patch settings_ai_path, params: valid_params
      expect(response).to have_http_status(:redirect)
      expect(workspace.reload.ai_provider).to eq('openai')
    end

    it 'redirects with alert on invalid config' do
      patch settings_ai_path, params: {
        workspace: { ai_provider: 'invalid', ai_model: 'gpt-4o', ai_selection_mode: 'automatic' }
      }
      expect(response).to have_http_status(:redirect)
    end
  end
end
