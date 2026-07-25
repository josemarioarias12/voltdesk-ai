# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::LeaveRequestsController, type: :request do
  let(:workspace)  { create(:workspace) }
  let(:hr_manager) { create(:user, workspace: workspace, role: :hr_manager) }
  let(:employee)   { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /hr/leave_requests' do
    before { sign_in hr_manager }

    it 'returns 200' do
      get hr_leave_requests_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'returns props' do
      get hr_leave_requests_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']).to include('leave_requests', 'stats')
    end
  end

  describe 'GET /hr/leave_requests/new' do
    before { sign_in employee }

    it 'returns 200' do
      get new_hr_leave_request_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /hr/leave_requests' do
    before { sign_in employee }

    let(:valid_params) do
      { leave_request: { leave_type: 'vacation',
          start_date: 10.days.from_now.to_date,
          end_date: 15.days.from_now.to_date,
          reason: 'Annual vacation',
          coverage_plan: 'Maria covers urgent tickets' } }
    end

    it 'creates a leave request' do
      expect { post hr_leave_requests_path, params: valid_params }.to change(LeaveRequest, :count).by(1)
    end

    it 'persists the coverage_plan' do
      post hr_leave_requests_path, params: valid_params
      expect(LeaveRequest.last.coverage_plan).to eq('Maria covers urgent tickets')
    end

    it 'redirects after creation' do
      post hr_leave_requests_path, params: valid_params
      expect(response).to have_http_status(:redirect)
    end
  end

  describe 'GET /hr/leave_requests/:id' do
    let(:leave_request) { create(:leave_request, user: employee, workspace: workspace) }

    before { sign_in hr_manager }

    it 'returns 200' do
      get hr_leave_request_path(leave_request), headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /hr/leave_requests/:id/approve' do
    let(:leave_request) { create(:leave_request, user: employee, workspace: workspace) }

    before { sign_in hr_manager }

    it 'approves and redirects' do
      post approve_hr_leave_request_path(leave_request)
      expect(response).to have_http_status(:redirect)
      expect(leave_request.reload.status).to eq('approved')
    end

    it 'creates a ComplianceLog entry for the decision' do
      expect { post approve_hr_leave_request_path(leave_request) }.to change(ComplianceLog, :count).by(1)
    end

    it 'records the decision metadata correctly' do
      post approve_hr_leave_request_path(leave_request)

      log = ComplianceLog.last
      expect(log.event_type).to eq('leave_request_decision')
      expect(log.resource_type).to eq('LeaveRequest')
      expect(log.resource_id).to eq(leave_request.id)
      expect(log.metadata['decision']).to eq('approved')
      expect(log.metadata['had_medical_notes']).to be(false)
    end

    context 'when the request has medical_notes' do
      let(:leave_request) do
        create(:leave_request, user: employee, workspace: workspace, medical_notes: 'Confidential detail')
      end

      it 'flags had_medical_notes as true in the compliance log' do
        post approve_hr_leave_request_path(leave_request)
        expect(ComplianceLog.last.metadata['had_medical_notes']).to be(true)
      end
    end
  end

  describe 'POST /hr/leave_requests/:id/reject' do
    let(:leave_request) { create(:leave_request, user: employee, workspace: workspace) }

    before { sign_in hr_manager }

    it 'rejects with reason and redirects' do
      post reject_hr_leave_request_path(leave_request), params: { rejection_reason: 'Not enough coverage' }
      expect(response).to have_http_status(:redirect)
      expect(leave_request.reload.status).to eq('rejected')
    end

    it 'creates a ComplianceLog entry for the decision' do
      expect do
        post reject_hr_leave_request_path(leave_request), params: { rejection_reason: 'Not enough coverage' }
      end.to change(ComplianceLog, :count).by(1)

      expect(ComplianceLog.last.metadata['decision']).to eq('rejected')
    end
  end
end
