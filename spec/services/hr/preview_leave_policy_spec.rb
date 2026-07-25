# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::PreviewLeavePolicy do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:user)       { create(:user, workspace: workspace, department: department) }

  describe '.call' do
    context 'when leave_type is blank' do
      it 'returns business_days but no policy data' do
        result = described_class.call(
          workspace: workspace, user: user, leave_type: '',
          start_date: 1.week.from_now.to_date.to_s, end_date: 2.weeks.from_now.to_date.to_s
        )

        expect(result).to be_success
        expect(result.data[:business_days]).to be > 0
        expect(result.data[:min_notice_days]).to be_nil
        expect(result.data[:max_concurrent]).to be_nil
      end
    end

    context 'when dates are blank' do
      it 'returns zero business_days' do
        result = described_class.call(
          workspace: workspace, user: user, leave_type: 'vacation', start_date: '', end_date: ''
        )

        expect(result).to be_success
        expect(result.data[:business_days]).to eq(0)
      end
    end

    context 'when a matching LeavePolicy exists' do
      before do
        create(:leave_policy, workspace: workspace, department: department,
                               max_concurrent: 2, min_notice_days: 7)
        create(:leave_request, workspace: workspace, user: user, department: department, status: :pending)
      end

      it 'returns the applicable policy limits and current concurrent count' do
        result = described_class.call(
          workspace: workspace, user: user, leave_type: 'vacation',
          start_date: 10.days.from_now.to_date.to_s, end_date: 15.days.from_now.to_date.to_s
        )

        expect(result).to be_success
        expect(result.data[:min_notice_days]).to eq(7)
        expect(result.data[:max_concurrent]).to eq(2)
        expect(result.data[:current_concurrent_count]).to eq(1)
      end

      it 'calculates business_days matching the LeaveRequest model logic' do
        result = described_class.call(
          workspace: workspace, user: user, leave_type: 'vacation',
          start_date: '2026-08-03', end_date: '2026-08-07'
        )

        expect(result.data[:business_days]).to eq(5)
      end
    end

    context 'when no matching policy exists' do
      it 'returns nil for all policy fields' do
        result = described_class.call(
          workspace: workspace, user: user, leave_type: 'vacation',
          start_date: 1.week.from_now.to_date.to_s, end_date: 2.weeks.from_now.to_date.to_s
        )

        expect(result).to be_success
        expect(result.data[:min_notice_days]).to be_nil
        expect(result.data[:max_concurrent]).to be_nil
        expect(result.data[:current_concurrent_count]).to be_nil
      end
    end

    context 'when dates are malformed' do
      it 'returns a failure' do
        result = described_class.call(
          workspace: workspace, user: user, leave_type: 'vacation',
          start_date: 'not-a-date', end_date: '2026-08-07'
        )

        expect(result).to be_failure
        expect(result.error).to eq('Invalid dates')
      end
    end

    context 'when end_date is before start_date' do
      it 'returns zero business_days without error' do
        result = described_class.call(
          workspace: workspace, user: user, leave_type: 'vacation',
          start_date: '2026-08-10', end_date: '2026-08-01'
        )

        expect(result).to be_success
        expect(result.data[:business_days]).to eq(0)
      end
    end
  end
end
