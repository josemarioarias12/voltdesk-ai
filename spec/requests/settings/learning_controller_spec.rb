# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Settings::LearningController, type: :request do
  let(:workspace)       { create(:workspace) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee)        { create(:user, workspace: workspace, role: :employee) }
  let(:dept)            { create(:department, workspace: workspace) }

  let(:learning_suggestion) do
    {
      'summary' => 'Billing tickets are often mislabeled as technical_support',
      'suggested_prompt_addition' => 'If the issue involves payment or invoices, classify as billing.',
      'correction_patterns' => [{ 'from' => 'billing', 'to' => 'technical_support', 'count' => 30, 'pct' => 60.0 }],
      'confidence' => 0.85,
      'generated_at' => Time.current.iso8601,
      'corrections_before_apply' => 50
    }
  end

  describe 'GET /settings/learning' do
    before { sign_in workspace_admin }

    it 'returns 200' do
      get settings_learning_index_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'returns total_corrections, corrections_last_30_days, top_patterns, learning_suggestion, threshold, and correction_rate_trend props' do
      get settings_learning_index_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']).to include(
        'total_corrections', 'corrections_last_30_days', 'top_patterns',
        'learning_suggestion', 'threshold', 'correction_rate_trend'
      )
      expect(json['props']['threshold']).to eq(50)
    end

    it 'redirects employee' do
      sign_in employee
      get settings_learning_index_path, headers: inertia_headers
      expect(response).to have_http_status(:redirect)
    end
  end

  describe 'POST /settings/learning/apply' do
    before { sign_in workspace_admin }

    context 'with a learning_suggestion present' do
      before do
        workspace.update!(settings: workspace.settings.merge('learning_suggestion' => learning_suggestion))
      end

      it 'appends suggested_prompt_addition to custom_prompt_context' do
        post apply_settings_learning_index_path
        expect(workspace.reload.settings['custom_prompt_context'])
          .to include('If the issue involves payment or invoices, classify as billing.')
      end

      it 'marks applied_at on the learning_suggestion' do
        post apply_settings_learning_index_path
        expect(workspace.reload.settings['learning_suggestion']['applied_at']).to be_present
      end

      it 'redirects to the index with a success notice' do
        post apply_settings_learning_index_path
        expect(response).to redirect_to(settings_learning_index_path)
        expect(flash[:notice]).to eq('Suggestion applied successfully.')
      end

      it 'preserves existing custom_prompt_context instead of overwriting it' do
        workspace.update!(settings: workspace.settings.merge('custom_prompt_context' => 'Existing context line.'))
        post apply_settings_learning_index_path
        context = workspace.reload.settings['custom_prompt_context']
        expect(context).to include('Existing context line.')
        expect(context).to include('If the issue involves payment or invoices, classify as billing.')
      end
    end

    context 'without a learning_suggestion' do
      it 'redirects with an alert and does not raise' do
        post apply_settings_learning_index_path
        expect(response).to redirect_to(settings_learning_index_path)
        expect(flash[:alert]).to eq('No suggestion available.')
      end
    end

    it 'redirects employee with unauthorized error' do
      sign_in employee
      post apply_settings_learning_index_path
      expect(response).to have_http_status(:redirect)
    end
  end

  describe 'POST /settings/learning/dismiss' do
    before { sign_in workspace_admin }

    it 'removes the learning_suggestion from workspace settings' do
      workspace.update!(settings: workspace.settings.merge('learning_suggestion' => learning_suggestion))
      post dismiss_settings_learning_index_path
      expect(workspace.reload.settings['learning_suggestion']).to be_nil
    end

    it 'redirects to the index with a success notice' do
      post dismiss_settings_learning_index_path
      expect(response).to redirect_to(settings_learning_index_path)
      expect(flash[:notice]).to eq('Suggestion dismissed.')
    end

    it 'redirects employee with unauthorized error' do
      sign_in employee
      post dismiss_settings_learning_index_path
      expect(response).to have_http_status(:redirect)
    end
  end
end
