# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::ProcessLeaveRequest do
  let(:workspace) { create(:workspace) }
  let(:employee)  { create(:user, workspace: workspace, role: :employee) }
  let(:manager)   { create(:user, workspace: workspace, role: :hr_manager) }

  describe '.call — create' do
    let(:params) do
      {
        leave_type: :vacation,
        start_date: 1.week.from_now.to_date,
        end_date: 2.weeks.from_now.to_date
      }
    end

    it 'creates a leave request with pending status' do
      result = described_class.call(
        workspace: workspace,
        user: employee,
        action: :create,
        options: { params: params }
      )

      expect(result).to be_success
      expect(result.data.status).to eq('pending')
      expect(result.data.user).to eq(employee)
    end

    it 'returns failure when dates are invalid' do
      result = described_class.call(
        workspace: workspace,
        user: employee,
        action: :create,
        options: { params: params.merge(end_date: 1.day.ago.to_date) }
      )

      expect(result).to be_failure
      expect(result.error).to include('End date')
    end
  end

  describe '.call — approve' do
    let(:leave_request) { create(:leave_request, workspace: workspace, user: employee) }

    it 'approves a pending leave request' do
      result = described_class.call(
        workspace: workspace,
        user: manager,
        action: :approve,
        options: { leave_request: leave_request, actor: manager }
      )

      expect(result).to be_success
      expect(result.data.status).to eq('approved')
      expect(result.data.approved_by).to eq(manager)
    end

    it 'returns failure when already processed' do
      leave_request.update!(status: :approved)

      result = described_class.call(
        workspace: workspace,
        user: manager,
        action: :approve,
        options: { leave_request: leave_request, actor: manager }
      )

      expect(result).to be_failure
      expect(result.error).to eq('Already processed')
    end
  end

  describe '.call — reject' do
    let(:leave_request) { create(:leave_request, workspace: workspace, user: employee) }

    it 'rejects with a reason' do
      result = described_class.call(
        workspace: workspace,
        user: manager,
        action: :reject,
        options: {
          leave_request: leave_request,
          actor: manager,
          params: { rejection_reason: 'Team at capacity' }
        }
      )

      expect(result).to be_success
      expect(result.data.status).to eq('rejected')
      expect(result.data.rejection_reason).to eq('Team at capacity')
    end

    it 'returns failure when rejection reason is missing' do
      result = described_class.call(
        workspace: workspace,
        user: manager,
        action: :reject,
        options: { leave_request: leave_request, actor: manager, params: {} }
      )

      expect(result).to be_failure
      expect(result.error).to eq('Rejection reason is required')
    end
  end
end
