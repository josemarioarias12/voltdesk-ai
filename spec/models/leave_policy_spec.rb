# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LeavePolicy do
  let(:workspace) { create(:workspace) }

  describe 'validations' do
    subject(:policy) { build(:leave_policy, workspace: workspace) }

    it { is_expected.to be_valid }

    it 'rejects a non-positive max_concurrent' do
      policy.max_concurrent = 0
      expect(policy).not_to be_valid
    end

    it 'allows a nil max_concurrent (no cap)' do
      policy.max_concurrent = nil
      expect(policy).to be_valid
    end

    it 'rejects a negative min_notice_days' do
      policy.min_notice_days = -1
      expect(policy).not_to be_valid
    end

    it 'requires second_approval_threshold_days when requires_second_approval is true' do
      policy.requires_second_approval = true
      policy.second_approval_threshold_days = nil
      expect(policy).not_to be_valid
    end

    it 'does not require second_approval_threshold_days when requires_second_approval is false' do
      policy.requires_second_approval = false
      policy.second_approval_threshold_days = nil
      expect(policy).to be_valid
    end

    it 'rejects a department from a different workspace' do
      other_department = create(:department, workspace: create(:workspace))
      policy.department = other_department
      expect(policy).not_to be_valid
    end

    it 'accepts a department from the same workspace' do
      department = create(:department, workspace: workspace)
      policy.department = department
      expect(policy).to be_valid
    end
  end

  describe '.resolve' do
    let(:department) { create(:department, workspace: workspace) }
    let(:other_department) { create(:department, workspace: workspace) }

    context 'when an exact department + leave_type policy exists' do
      let!(:exact_policy) do
        create(:leave_policy, :for_vacation, workspace: workspace, department: department, max_concurrent: 1)
      end
      let!(:department_wide_policy) do
        create(:leave_policy, workspace: workspace, department: department, max_concurrent: 2)
      end
      let!(:default_policy) { create(:leave_policy, workspace: workspace, max_concurrent: 5) }

      it 'returns the most specific match' do
        result = described_class.resolve(workspace: workspace, department_id: department.id, leave_type: :vacation)
        expect(result).to eq(exact_policy)
      end
    end

    context 'when only a department-wide policy exists (any leave_type)' do
      let!(:department_wide_policy) do
        create(:leave_policy, workspace: workspace, department: department, max_concurrent: 2)
      end
      let!(:default_policy) { create(:leave_policy, workspace: workspace, max_concurrent: 5) }

      it 'falls back to the department-wide policy' do
        result = described_class.resolve(workspace: workspace, department_id: department.id, leave_type: :sick_leave)
        expect(result).to eq(department_wide_policy)
      end
    end

    context 'when only a leave_type-wide policy exists (any department)' do
      let!(:type_wide_policy) do
        create(:leave_policy, :for_vacation, workspace: workspace, max_concurrent: 3)
      end
      let!(:default_policy) { create(:leave_policy, workspace: workspace, max_concurrent: 5) }

      it 'falls back to the leave_type-wide policy' do
        result = described_class.resolve(workspace: workspace, department_id: department.id, leave_type: :vacation)
        expect(result).to eq(type_wide_policy)
      end
    end

    context 'when only the workspace default exists' do
      let!(:default_policy) { create(:leave_policy, workspace: workspace, max_concurrent: 5) }

      it 'falls back to the workspace default' do
        result = described_class.resolve(workspace: workspace, department_id: department.id, leave_type: :vacation)
        expect(result).to eq(default_policy)
      end
    end

    context 'when no matching policy exists' do
      it 'returns nil' do
        result = described_class.resolve(workspace: workspace, department_id: department.id, leave_type: :vacation)
        expect(result).to be_nil
      end
    end

    context 'when the policy is inactive' do
      let!(:inactive_policy) do
        create(:leave_policy, workspace: workspace, max_concurrent: 1, active: false)
      end

      it 'is not returned' do
        result = described_class.resolve(workspace: workspace, department_id: department.id, leave_type: :vacation)
        expect(result).to be_nil
      end
    end

    context 'when the policy belongs to a different department' do
      let!(:other_department_policy) do
        create(:leave_policy, workspace: workspace, department: other_department, max_concurrent: 1)
      end

      it 'does not match' do
        result = described_class.resolve(workspace: workspace, department_id: department.id, leave_type: :vacation)
        expect(result).to be_nil
      end
    end
  end
end
