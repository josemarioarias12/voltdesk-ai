# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::AuditLogController, type: :request do
  let(:workspace)       { create(:workspace) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee)        { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /admin/audit-log' do
    before { sign_in workspace_admin }

    it 'returns 200' do
      get admin_audit_log_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'redirects employee' do
      sign_in employee
      get admin_audit_log_path, headers: inertia_headers
      expect(response).to have_http_status(:redirect)
    end

    context 'when filtering by assistant_message_id' do
      let(:conversation)       { create(:assistant_conversation, workspace: workspace, user: workspace_admin) }
      let(:assistant_message)  { create(:assistant_message, assistant_conversation: conversation, role: :assistant) }
      let(:matching_log)       { create(:ai_audit_log, workspace: workspace, assistant_message: assistant_message) }
      let(:unrelated_log)      { create(:ai_audit_log, workspace: workspace) }

      before do
        matching_log
        unrelated_log
      end

      it 'returns only logs linked to that assistant message' do
        get admin_audit_log_path, params: { assistant_message_id: assistant_message.id }, headers: inertia_headers
        json = response.parsed_body
        ids = json['props']['logs'].pluck('id')
        expect(ids).to contain_exactly(matching_log.id)
      end
    end

    context 'when highlight_id is present' do
      let(:log) { create(:ai_audit_log, workspace: workspace) }

      it 'passes it through as an integer prop' do
        get admin_audit_log_path, params: { highlight_id: log.id.to_s }, headers: inertia_headers
        json = response.parsed_body
        expect(json['props']['highlight_id']).to eq(log.id)
      end
    end

    it 'defaults highlight_id to nil when absent' do
      get admin_audit_log_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']['highlight_id']).to be_nil
    end
  end
end
