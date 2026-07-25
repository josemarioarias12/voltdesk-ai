# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::ProcessLeaveRequest do
  let(:workspace) { create(:workspace) }
  let(:employee)  { create(:user, workspace: workspace, role: :employee) }
  let(:manager)   { create(:user, workspace: workspace, role: :hr_manager) }
  let(:admin)     { create(:user, workspace: workspace, role: :workspace_admin) }

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

    context 'when the applicable policy requires second approval' do
      let(:leave_request) do
        create(:leave_request, workspace: workspace, user: employee,
                                start_date: 10.days.from_now, end_date: 20.days.from_now)
      end

      before do
        create(:leave_policy, :with_second_approval, workspace: workspace)
      end

      it 'moves to pending_second_approval instead of approved when duration meets the threshold' do
        result = described_class.call(
          workspace: workspace,
          user: manager,
          action: :approve,
          options: { leave_request: leave_request, actor: manager }
        )

        expect(result).to be_success
        expect(result.data.status).to eq('pending_second_approval')
        expect(result.data.approved_by).to eq(manager)
      end

      it 'approves directly when duration is below the threshold' do
        leave_request.update_columns(start_date: 1.day.from_now, end_date: 2.days.from_now)

        result = described_class.call(
          workspace: workspace,
          user: manager,
          action: :approve,
          options: { leave_request: leave_request, actor: manager }
        )

        expect(result).to be_success
        expect(result.data.status).to eq('approved')
      end
    end
  end

  describe '.call — final_approve' do
    let(:leave_request) do
      create(:leave_request, workspace: workspace, user: employee, status: :pending_second_approval,
                             approved_by: manager)
    end

    it 'approves a request pending second approval' do
      result = described_class.call(
        workspace: workspace,
        user: admin,
        action: :final_approve,
        options: { leave_request: leave_request, actor: admin }
      )

      expect(result).to be_success
      expect(result.data.status).to eq('approved')
      expect(result.data.approved_by).to eq(admin)
    end

    it 'returns failure when the request is not pending_second_approval' do
      leave_request.update!(status: :pending)

      result = described_class.call(
        workspace: workspace,
        user: admin,
        action: :final_approve,
        options: { leave_request: leave_request, actor: admin }
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

    context 'when the request is pending_second_approval' do
      let(:leave_request) do
        create(:leave_request, workspace: workspace, user: employee, status: :pending_second_approval,
                               approved_by: manager)
      end

      it 'can still be rejected' do
        result = described_class.call(
          workspace: workspace,
          user: admin,
          action: :reject,
          options: {
            leave_request: leave_request,
            actor: admin,
            params: { rejection_reason: 'Reconsidered' }
          }
        )

        expect(result).to be_success
        expect(result.data.status).to eq('rejected')
      end
    end
  end
end
