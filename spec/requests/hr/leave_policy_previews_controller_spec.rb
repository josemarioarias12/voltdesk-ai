# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::LeavePolicyPreviewsController, type: :request do
  let(:workspace) { create(:workspace) }
  let(:employee)  { create(:user, workspace: workspace, role: :employee) }

  before { sign_in employee }

  describe 'GET /hr/leave_requests/policy_preview' do
    it 'returns 200 with business_days and policy fields' do
      get hr_leave_policy_preview_path, params: {
        leave_type: 'vacation', start_date: 1.week.from_now.to_date.to_s, end_date: 2.weeks.from_now.to_date.to_s
      }

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json).to include('business_days', 'min_notice_days', 'max_concurrent', 'current_concurrent_count')
    end

    it 'returns unprocessable_content for malformed dates' do
      get hr_leave_policy_preview_path, params: { leave_type: 'vacation', start_date: 'garbage', end_date: 'garbage' }

      expect(response).to have_http_status(:unprocessable_content)
    end

    context 'when the user cannot create leave requests' do
      let(:guest) { create(:user, workspace: workspace, role: :guest) }

      before { sign_in guest }

      it 'is forbidden' do
        get hr_leave_policy_preview_path, params: {
          leave_type: 'vacation', start_date: 1.week.from_now.to_date.to_s, end_date: 2.weeks.from_now.to_date.to_s
        }

        expect(response).to redirect_to(root_path)
      end
    end
  end
end
