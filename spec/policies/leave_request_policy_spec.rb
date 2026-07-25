# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LeaveRequestPolicy do
  subject { described_class.new(user, leave_request) }

  let(:workspace)     { create(:workspace) }
  let(:owner)         { create(:user, workspace: workspace, role: :employee) }
  let(:leave_request) { create(:leave_request, user: owner, workspace: workspace) }

  context 'when the owner' do
    let(:user) { owner }

    it { is_expected.to be_index }
    it { is_expected.to be_show }
    it { is_expected.to be_create }
    it { is_expected.not_to be_approve }
    it { is_expected.not_to be_reject }
  end

  context 'when hr_manager' do
    let(:user) { create(:user, workspace: workspace, role: :hr_manager) }

    it { is_expected.to be_approve }
    it { is_expected.to be_reject }
    it { is_expected.not_to be_destroy }
  end

  context 'when workspace_admin' do
    let(:user) { create(:user, workspace: workspace, role: :workspace_admin) }

    it { is_expected.to be_approve }
  end

  context 'when department_manager' do
    let(:department) { create(:department, workspace: workspace) }
    let(:manager)    { create(:user, workspace: workspace, role: :department_manager, department: department) }

    context 'and the request belongs to their department' do
      let(:owner)          { create(:user, workspace: workspace, department: department, role: :employee) }
      let(:leave_request)  { create(:leave_request, user: owner, workspace: workspace, department: department) }
      let(:user)           { manager }

      it { is_expected.to be_show }
      it { is_expected.to be_approve }
      it { is_expected.to be_reject }

      context 'when the request has medical_notes' do
        let(:leave_request) do
          create(:leave_request, user: owner, workspace: workspace, department: department,
                                  medical_notes: 'Confidential medical detail')
        end

        it { is_expected.not_to be_approve }
        it { is_expected.not_to be_reject }
      end
    end

    context 'and the request belongs to a different department' do
      let(:other_department) { create(:department, workspace: workspace) }
      let(:owner)            { create(:user, workspace: workspace, department: other_department, role: :employee) }
      let(:leave_request) do
        create(:leave_request, user: owner, workspace: workspace, department: other_department)
      end
      let(:user) { manager }

      it { is_expected.not_to be_show }
      it { is_expected.not_to be_approve }
    end
  end

  context 'when different employee' do
    let(:user) { create(:user, workspace: workspace, role: :employee) }

    it { is_expected.not_to be_show }
    it { is_expected.not_to be_approve }
  end

  describe 'destroy?' do
    context 'when owner and request is pending' do
      let(:user) { owner }

      it { is_expected.to be_destroy }
    end

    context 'when owner but request is approved' do
      let(:user) { owner }
      let(:leave_request) { create(:leave_request, user: owner, workspace: workspace, status: :approved) }

      it { is_expected.not_to be_destroy }
    end
  end

  describe 'Scope' do
    let(:other_employee) { create(:user, workspace: workspace, role: :employee) }
    let!(:own_request)   { create(:leave_request, user: owner, workspace: workspace) }
    let!(:other_request) { create(:leave_request, user: other_employee, workspace: workspace) }

    context 'when hr_manager' do
      let(:user) { create(:user, workspace: workspace, role: :hr_manager) }

      it 'sees all requests in workspace' do
        result = described_class::Scope.new(user, LeaveRequest.all).resolve
        expect(result).to include(own_request, other_request)
      end
    end

    context 'when department_manager' do
      let(:department)       { create(:department, workspace: workspace) }
      let(:user)             { create(:user, workspace: workspace, role: :department_manager, department: department) }
      let!(:own_dept_request) do
        dept_employee = create(:user, workspace: workspace, department: department, role: :employee)
        create(:leave_request, user: dept_employee, workspace: workspace, department: department)
      end

      it 'sees only requests from their own department' do
        result = described_class::Scope.new(user, LeaveRequest.all).resolve
        expect(result).to include(own_dept_request)
        expect(result).not_to include(own_request, other_request)
      end
    end

    context 'when employee' do
      let(:user) { owner }

      it 'sees only own requests' do
        result = described_class::Scope.new(user, LeaveRequest.all).resolve
        expect(result).to include(own_request)
        expect(result).not_to include(other_request)
      end
    end
  end
end
