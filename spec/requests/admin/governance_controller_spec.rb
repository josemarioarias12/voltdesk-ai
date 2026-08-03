# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::GovernanceController, type: :request do
  let(:workspace)       { create(:workspace) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee)        { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /admin/governance' do
    before { sign_in workspace_admin }

    it 'returns 200' do
      get admin_governance_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'redirects employee' do
      sign_in employee
      get admin_governance_path, headers: inertia_headers
      expect(response).to have_http_status(:redirect)
    end

    context 'when filtering by suggestion_type' do
      let(:pricing_suggestion)     { create(:ai_model_governance_suggestion, suggestion_type: :pricing_update) }
      let(:deprecation_suggestion) { create(:ai_model_governance_suggestion, suggestion_type: :model_deprecation) }

      before do
        pricing_suggestion
        deprecation_suggestion
      end

      it 'returns only suggestions of that type' do
        get admin_governance_path, params: { suggestion_type: 'pricing_update' }, headers: inertia_headers
        json = response.parsed_body
        ids = json['props']['suggestions'].pluck('id')
        expect(ids).to contain_exactly(pricing_suggestion.id)
      end
    end
  end

  describe 'PATCH /admin/governance/:id/approve' do
    let(:suggestion) { create(:ai_model_governance_suggestion, suggestion_type: :model_deprecation) }

    before { sign_in workspace_admin }

    it 'approves the suggestion and redirects' do
      patch admin_governance_approve_path(suggestion)
      expect(response).to redirect_to(admin_governance_path)
      expect(suggestion.reload.status_approved?).to be true
      expect(suggestion.reviewed_by).to eq(workspace_admin)
    end

    context 'when the suggestion is a pricing_update with real fetched data' do
      let(:suggestion) do
        create(:ai_model_governance_suggestion,
               suggestion_type: :pricing_update,
               result: { 'fetched_input' => 0.002, 'fetched_output' => 0.01, 'source' => 'openrouter' })
      end

      it 'applies the price immediately instead of leaving it approved' do
        patch admin_governance_approve_path(suggestion)
        expect(suggestion.reload.status_applied?).to be true
      end
    end

    it 'is forbidden for employee' do
      sign_in employee
      patch admin_governance_approve_path(suggestion)
      expect(response).to have_http_status(:redirect)
      expect(suggestion.reload.status_pending_approval?).to be true
    end
  end

  describe 'PATCH /admin/governance/:id/reject' do
    let(:suggestion) { create(:ai_model_governance_suggestion) }

    before { sign_in workspace_admin }

    it 'rejects the suggestion' do
      patch admin_governance_reject_path(suggestion)
      expect(suggestion.reload.status_rejected?).to be true
    end
  end

  describe 'PATCH /admin/governance/:id/mark_applied' do
    let(:suggestion) { create(:ai_model_governance_suggestion, status: :approved) }

    before { sign_in workspace_admin }

    it 'marks the suggestion as applied' do
      patch admin_governance_mark_applied_path(suggestion)
      expect(suggestion.reload.status_applied?).to be true
      expect(suggestion.reload.applied_at).to be_present
    end
  end

  describe 'POST /admin/governance/sync_now' do
    before { sign_in workspace_admin }

    it 'enqueues the sync job with the requested check types' do
      expect do
        post admin_governance_sync_now_path, params: { check_type: ['pricing'] }
      end.to have_enqueued_job(Ai::ModelGovernanceSyncJob).with(['pricing'])
    end

    it 'defaults to both check types when none is specified' do
      expect do
        post admin_governance_sync_now_path
      end.to have_enqueued_job(Ai::ModelGovernanceSyncJob).with(%w[pricing deprecation])
    end
  end
end
