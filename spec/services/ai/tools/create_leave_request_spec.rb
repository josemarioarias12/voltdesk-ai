# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::CreateLeaveRequest do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:employee)   { create(:user, workspace: workspace, department: department, role: :employee) }

  describe '.visible_to?' do
    it 'is visible to every role except guest, matching LeaveRequestPolicy#create?' do
      %i[super_admin workspace_admin hr_manager it_manager facilities_manager
         operations_manager department_manager agent employee].each do |role|
        expect(described_class.visible_to?(build(:user, role: role))).to be(true)
      end
    end

    it 'is not visible to guest' do
      expect(described_class.visible_to?(build(:user, role: :guest))).to be(false)
    end
  end

  describe '#call' do
    subject(:tool) { described_class.new(user: employee, workspace: workspace, locale: 'en') }

    let(:start_date) { 10.days.from_now.to_date }
    let(:end_date) { 12.days.from_now.to_date }

    context 'preview (confirmed omitted or false)' do
      it 'does not persist a leave request' do
        expect do
          tool.call(leave_type: 'vacation', start_date: start_date.to_s, end_date: end_date.to_s)
        end.not_to change(LeaveRequest, :count)
      end

      it 'returns a preview summary with business_days' do
        result = tool.call(leave_type: 'vacation', start_date: start_date.to_s, end_date: end_date.to_s)

        expect(result).to be_success
        expect(result.data[:preview]).to be(true)
        expect(result.data[:summary][:leave_type]).to eq('vacation')
        expect(result.data[:summary][:business_days]).to be_a(Integer)
      end

      it 'includes min_notice_days and max_concurrent when a matching policy exists' do
        create(:leave_policy, workspace: workspace, department: department, leave_type: :vacation,
                              min_notice_days: 5, max_concurrent: 2)

        result = tool.call(leave_type: 'vacation', start_date: start_date.to_s, end_date: end_date.to_s)

        expect(result.data[:summary][:min_notice_days]).to eq(5)
        expect(result.data[:summary][:max_concurrent]).to eq(2)
      end

      it 'returns nil policy fields when no policy applies' do
        result = tool.call(leave_type: 'vacation', start_date: start_date.to_s, end_date: end_date.to_s)

        expect(result.data[:summary][:min_notice_days]).to be_nil
        expect(result.data[:summary][:max_concurrent]).to be_nil
      end

      it 'fails validation without raising when the start date is in the past' do
        result = tool.call(leave_type: 'vacation', start_date: 2.days.ago.to_date.to_s,
                           end_date: 1.day.ago.to_date.to_s)

        expect(result).to be_failure
        expect(result.error).to include("can't be in the past")
      end

      it 'fails validation without raising when it violates the minimum notice policy' do
        create(:leave_policy, workspace: workspace, department: department, leave_type: :vacation,
                              min_notice_days: 30)

        result = tool.call(leave_type: 'vacation', start_date: 2.days.from_now.to_date.to_s,
                           end_date: 4.days.from_now.to_date.to_s)

        expect(result).to be_failure
        expect(result.error).to include('at least 30 days in advance')
      end
    end

    context 'confirmed: true' do
      it 'persists a real leave request via Hr::ProcessLeaveRequest' do
        expect do
          tool.call(leave_type: 'vacation', start_date: start_date.to_s, end_date: end_date.to_s, confirmed: true)
        end.to change(LeaveRequest, :count).by(1)
      end

      it 'creates the leave request as pending, owned by the current user' do
        result = tool.call(leave_type: 'vacation', start_date: start_date.to_s, end_date: end_date.to_s,
                           confirmed: true)

        expect(result).to be_success
        expect(result.data[:leave_request].user).to eq(employee)
        expect(result.data[:leave_request].status).to eq('pending')
      end

      it 'returns a resource_link pointing to the created leave request' do
        result = tool.call(leave_type: 'vacation', start_date: start_date.to_s, end_date: end_date.to_s,
                           confirmed: true)
        leave_request = result.data[:leave_request]

        expect(result.data[:resource_link]).to eq(
          title: 'Vacation request',
          path: "/hr/leave_requests/#{leave_request.id}",
          icon: 'calendar'
        )
      end
    end
  end
end
