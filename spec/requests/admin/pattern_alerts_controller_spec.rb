# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::PatternAlertsController, type: :request do
  let(:workspace)       { create(:workspace) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee)        { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /admin/pattern_alerts' do
    before { sign_in workspace_admin }

    it 'returns 200' do
      get admin_pattern_alerts_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'redirects employee' do
      sign_in employee
      get admin_pattern_alerts_path, headers: inertia_headers
      expect(response).to have_http_status(:redirect)
    end
  end

  describe 'PATCH /admin/pattern_alerts/:id' do
    let!(:alert) { create(:pattern_alert, workspace: workspace) }

    before { sign_in workspace_admin }

    it 'resolves the alert and redirects' do
      patch admin_pattern_alert_path(alert), headers: inertia_headers

      expect(alert.reload.resolved?).to be true
      expect(response).to have_http_status(:redirect)
    end
  end

  describe 'POST /admin/pattern_alerts/run_now' do
    before { sign_in workspace_admin }

    it 'enqueues AnomalyDetectorJob for the current workspace' do
      expect do
        post admin_pattern_alerts_run_now_path, headers: inertia_headers
      end.to have_enqueued_job(AnomalyDetectorJob).with(workspace.id)
    end

    it 'redirects with a confirmation notice' do
      post admin_pattern_alerts_run_now_path, headers: inertia_headers
      expect(response).to have_http_status(:redirect)
    end
  end
end
