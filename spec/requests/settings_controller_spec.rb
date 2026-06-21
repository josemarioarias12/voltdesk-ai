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

    it 'returns workspace, provider_models, cost_table, automation, and ticket_categories props' do
      get settings_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']).to include('workspace', 'provider_models', 'cost_table', 'automation', 'ticket_categories')
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

  describe 'PATCH /settings/automation' do
    before { sign_in workspace_admin }

    let(:valid_params) do
      { workspace: { agent_urgency_threshold: 70, agent_similarity_threshold: 0.8,
                     human_in_the_loop: true, automatable_categories: %w[it hr] } }
    end

    it 'updates automation config and redirects' do
      patch settings_automation_path, params: valid_params
      expect(response).to have_http_status(:redirect)
      expect(workspace.reload.settings['agent_urgency_threshold']).to eq(70.0)
      expect(workspace.settings['automatable_categories']).to eq(%w[it hr])
    end

    it 'redirects with alert on invalid category' do
      patch settings_automation_path, params: {
        workspace: { agent_urgency_threshold: 70, agent_similarity_threshold: 0.8,
                     human_in_the_loop: false, automatable_categories: %w[not_a_real_category] }
      }
      expect(response).to have_http_status(:redirect)
      expect(workspace.reload.settings['automatable_categories']).not_to eq(%w[not_a_real_category])
    end

    it 'redirects employee with unauthorized error' do
      sign_in employee
      patch settings_automation_path, params: valid_params
      expect(response).to have_http_status(:redirect)
    end
  end
end
