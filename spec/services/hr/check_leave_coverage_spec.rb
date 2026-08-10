# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::CheckLeaveCoverage do
  subject(:result) { described_class.call(leave_request: leave_request) }

  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:requester)  { create(:user, workspace: workspace, department: department) }
  let(:leave_request) do
    create(:leave_request, workspace: workspace, user: requester, department: department,
                            start_date: 10.days.from_now, end_date: 15.days.from_now)
  end

  it 'returns success' do
    expect(result).to be_success
  end

  it 'returns no conflicts when nobody else in the department is out' do
    expect(result.data).to be_empty
  end

  context 'when another user in the same department has an overlapping approved request' do
    let!(:colleague_request) do
      create(:leave_request, workspace: workspace, department: department,
                              user: create(:user, workspace: workspace, department: department),
                              status: :approved, start_date: 12.days.from_now, end_date: 20.days.from_now)
    end

    it 'includes it as a conflict' do
      expect(result.data).to contain_exactly(colleague_request)
    end
  end

  context 'when the overlapping request is pending_second_approval' do
    let!(:colleague_request) do
      create(:leave_request, workspace: workspace, department: department,
                              user: create(:user, workspace: workspace, department: department),
                              status: :pending_second_approval, approved_by: create(:user, workspace: workspace),
                              start_date: 12.days.from_now, end_date: 20.days.from_now)
    end

    it 'includes it as a conflict' do
      expect(result.data).to contain_exactly(colleague_request)
    end
  end

  context 'when the overlapping request is only pending (first stage)' do
    let!(:colleague_pending_request) do
      create(:leave_request, workspace: workspace, department: department,
                              user: create(:user, workspace: workspace, department: department),
                              status: :pending, start_date: 12.days.from_now, end_date: 20.days.from_now)
    end

    it 'excludes it' do
      expect(result.data).to be_empty
    end
  end

  context 'when the overlapping request belongs to a different department' do
    let!(:other_department_request) do
      create(:leave_request, workspace: workspace, department: create(:department, workspace: workspace),
                              user: create(:user, workspace: workspace), status: :approved,
                              start_date: 12.days.from_now, end_date: 20.days.from_now)
    end

    it 'excludes it' do
      expect(result.data).to be_empty
    end
  end

  context "when the overlapping request belongs to the requester's own other request" do
    before { leave_request }

    let!(:own_other_request) do
      create(:leave_request, workspace: workspace, department: department, user: requester,
                              status: :approved, start_date: 12.days.from_now, end_date: 20.days.from_now)
    end

    it 'excludes it' do
      expect(result.data).to be_empty
    end
  end

  context 'when the dates do not overlap' do
    let!(:non_overlapping_request) do
      create(:leave_request, workspace: workspace, department: department,
                              user: create(:user, workspace: workspace, department: department),
                              status: :approved, start_date: 30.days.from_now, end_date: 35.days.from_now)
    end

    it 'excludes it' do
      expect(result.data).to be_empty
    end
  end
end
