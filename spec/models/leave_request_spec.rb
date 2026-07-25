# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LeaveRequest do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:user)       { create(:user, workspace: workspace, department: department) }

  describe 'leave cap enforcement' do
    context 'when a department-wide cap policy exists' do
      before do
        create(:leave_policy, workspace: workspace, department: department, max_concurrent: 2)
      end

      it 'allows requests under the cap' do
        create(:leave_request, workspace: workspace, user: user, status: :pending)

        new_request = build(:leave_request, workspace: workspace, user: user)
        expect(new_request).to be_valid
      end

      it 'blocks requests at the cap, counting pending + approved together' do
        create(:leave_request, workspace: workspace, user: user, status: :pending)
        create(:leave_request, :approved, workspace: workspace, user: user, start_date: 3.weeks.from_now,
                                           end_date: 4.weeks.from_now)

        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 5.weeks.from_now,
                                             end_date: 6.weeks.from_now)
        expect(new_request).not_to be_valid
        expect(new_request.errors[:base]).to include(include('reached its limit of 2'))
      end

      it 'does not count rejected requests toward the cap' do
        create(:leave_request, :rejected, workspace: workspace, user: user)
        create(:leave_request, workspace: workspace, user: user, status: :pending)

        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 3.weeks.from_now,
                                             end_date: 4.weeks.from_now)
        expect(new_request).to be_valid
      end

      it 'does not count requests from a different department' do
        other_department = create(:department, workspace: workspace)
        other_user = create(:user, workspace: workspace, department: other_department)
        create(:leave_request, workspace: workspace, user: other_user, status: :pending)
        create(:leave_request, workspace: workspace, user: other_user, status: :pending,
                                start_date: 3.weeks.from_now, end_date: 4.weeks.from_now)

        new_request = build(:leave_request, workspace: workspace, user: user)
        expect(new_request).to be_valid
      end
    end

    context 'when the applicable policy is leave_type-specific' do
      before do
        create(:leave_policy, :for_vacation, workspace: workspace, max_concurrent: 1)
      end

      it 'blocks vacation requests at the cap but allows other leave types' do
        create(:leave_request, workspace: workspace, user: user, leave_type: :vacation, status: :pending)

        blocked = build(:leave_request, workspace: workspace, user: user, leave_type: :vacation,
                                         start_date: 3.weeks.from_now, end_date: 4.weeks.from_now)
        allowed = build(:leave_request, :sick, workspace: workspace, user: user)

        expect(blocked).not_to be_valid
        expect(allowed).to be_valid
      end
    end

    context 'when no policy applies' do
      it 'has no cap' do
        3.times { create(:leave_request, workspace: workspace, user: user, status: :pending) }

        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 5.weeks.from_now,
                                             end_date: 6.weeks.from_now)
        expect(new_request).to be_valid
      end
    end
  end

  describe 'minimum notice enforcement' do
    context 'when a notice policy exists' do
      before do
        create(:leave_policy, workspace: workspace, department: department, min_notice_days: 14)
      end

      it 'rejects a request starting sooner than the required notice' do
        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 5.days.from_now,
                                             end_date: 7.days.from_now)
        expect(new_request).not_to be_valid
        expect(new_request.errors[:start_date]).to include(include('at least 14 days'))
      end

      it 'allows a request that meets the required notice' do
        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 20.days.from_now,
                                             end_date: 22.days.from_now)
        expect(new_request).to be_valid
      end
    end

    context 'when no policy applies' do
      it 'allows a request starting tomorrow' do
        new_request = build(:leave_request, workspace: workspace, user: user, start_date: 1.day.from_now,
                                             end_date: 2.days.from_now)
        expect(new_request).to be_valid
      end
    end
  end
end
