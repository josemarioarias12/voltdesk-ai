# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::LeaveRequestsController, type: :request do
  let(:workspace)      { create(:workspace) }
  let(:hr_manager)     { create(:user, workspace: workspace, role: :hr_manager) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee) { create(:user, workspace: workspace, role: :employee) }

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

    context 'with a doctor_certificate attached' do
      let(:certificate_file) do
        fixture_file_upload(Rails.root.join('spec/fixtures/files/certificate.png'), 'image/png')
      end
      let(:params_with_certificate) do
        { leave_request: { leave_type: 'sick_leave',
            start_date: 1.day.from_now.to_date,
            end_date: 3.days.from_now.to_date,
            medical_notes: 'Doctor recommended 3 days of rest',
            doctor_certificate: certificate_file } }
      end

      it 'attaches the certificate to the created request' do
        post hr_leave_requests_path, params: params_with_certificate
        expect(LeaveRequest.last.doctor_certificate).to be_attached
      end

      it 'persists the medical_notes' do
        post hr_leave_requests_path, params: params_with_certificate
        expect(LeaveRequest.last.medical_notes).to eq('Doctor recommended 3 days of rest')
      end
    end
  end

  describe 'GET /hr/leave_requests/:id' do
    let(:leave_request) { create(:leave_request, user: employee, workspace: workspace) }

    before { sign_in hr_manager }

    it 'returns 200' do
      get hr_leave_request_path(leave_request), headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'includes can_approve for hr_manager on a pending request' do
      get hr_leave_request_path(leave_request), headers: inertia_headers
      json = response.parsed_body
      expect(json['props']['leave_request']['can_approve']).to be(true)
      expect(json['props']['leave_request']['can_final_approve']).to be(false)
    end

    context 'when the request is pending_second_approval' do
      let(:leave_request) do
        create(:leave_request, user: employee, workspace: workspace, status: :pending_second_approval,
                               approved_by: hr_manager)
      end

      it 'shows hr_manager as unable to act, but able to view' do
        get hr_leave_request_path(leave_request), headers: inertia_headers
        json = response.parsed_body
        expect(json['props']['leave_request']['can_approve']).to be(false)
        expect(json['props']['leave_request']['can_final_approve']).to be(false)
      end

      it 'shows workspace_admin as able to give final approval' do
        sign_in workspace_admin
        get hr_leave_request_path(leave_request), headers: inertia_headers
        json = response.parsed_body
        expect(json['props']['leave_request']['can_final_approve']).to be(true)
        expect(json['props']['leave_request']['can_approve']).to be(false)
      end
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

    context 'when the applicable policy requires second approval and the duration meets the threshold' do
      let(:leave_request) do
        create(:leave_request, user: employee, workspace: workspace,
                                start_date: 10.days.from_now, end_date: 20.days.from_now)
      end

      before { create(:leave_policy, :with_second_approval, workspace: workspace) }

      it 'moves to pending_second_approval instead of approved' do
        post approve_hr_leave_request_path(leave_request)
        expect(leave_request.reload.status).to eq('pending_second_approval')
      end

      it 'does not allow hr_manager to approve it a second time' do
        post approve_hr_leave_request_path(leave_request)
        leave_request.reload

        post approve_hr_leave_request_path(leave_request)

        expect(response).to redirect_to(root_path)
        expect(leave_request.reload.status).to eq('pending_second_approval')
      end

      it 'allows workspace_admin to give final approval on the same endpoint' do
        post approve_hr_leave_request_path(leave_request)
        leave_request.reload

        sign_in workspace_admin
        post approve_hr_leave_request_path(leave_request)

        expect(leave_request.reload.status).to eq('approved')
        expect(leave_request.approved_by).to eq(workspace_admin)
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

    context 'when the request is pending_second_approval' do
      let(:leave_request) do
        create(:leave_request, user: employee, workspace: workspace, status: :pending_second_approval,
                               approved_by: hr_manager)
      end

      it 'does not allow hr_manager to reject it' do
        post reject_hr_leave_request_path(leave_request), params: { rejection_reason: 'Changed my mind' }

        expect(response).to redirect_to(root_path)
        expect(leave_request.reload.status).to eq('pending_second_approval')
      end

      it 'allows workspace_admin to reject it' do
        sign_in workspace_admin
        post reject_hr_leave_request_path(leave_request), params: { rejection_reason: 'Reconsidered' }
        expect(leave_request.reload.status).to eq('rejected')
      end
    end
  end
end
