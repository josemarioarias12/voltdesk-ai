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
          reason: 'Annual vacation' } }
    end

    it 'creates a leave request' do
      expect { post hr_leave_requests_path, params: valid_params }.to change(LeaveRequest, :count).by(1)
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
  end

  describe 'POST /hr/leave_requests/:id/reject' do
    let(:leave_request) { create(:leave_request, user: employee, workspace: workspace) }

    before { sign_in hr_manager }

    it 'rejects with reason and redirects' do
      post reject_hr_leave_request_path(leave_request), params: { rejection_reason: 'Not enough coverage' }
      expect(response).to have_http_status(:redirect)
      expect(leave_request.reload.status).to eq('rejected')
    end
  end
end
