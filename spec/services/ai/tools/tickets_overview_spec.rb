# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::TicketsOverview do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:other_dept) { create(:department, workspace: workspace) }

  describe '.visible_to?' do
    it 'is visible to every role except guest' do
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
    context 'as employee' do
      subject(:result) { described_class.new(user: employee, workspace: workspace).call }

      let(:employee) { create(:user, workspace: workspace, department: department, role: :employee) }

      it 'only counts tickets they personally created' do
        create(:ticket, workspace: workspace, department: department, created_by: employee, status: :open)
        other = create(:user, workspace: workspace, department: department)
        create(:ticket, workspace: workspace, department: department, created_by: other, status: :open)

        expect(result.data[:total]).to eq(1)
      end
    end

    context 'as agent' do
      subject(:result) { described_class.new(user: agent, workspace: workspace).call }

      let(:agent) { create(:user, workspace: workspace, department: department, role: :agent) }

      it 'sees tickets assigned to them regardless of department' do
        create(:ticket, workspace: workspace, department: other_dept, assigned_to: agent, status: :open)

        expect(result.data[:total]).to eq(1)
      end

      it 'sees unassigned tickets in their own department' do
        create(:ticket, workspace: workspace, department: department, status: :open)

        expect(result.data[:total]).to eq(1)
      end

      it 'does not see other departments unrelated to them' do
        create(:ticket, workspace: workspace, department: other_dept, status: :open)

        expect(result.data[:total]).to eq(0)
      end
    end

    context 'as department_manager' do
      subject(:result) { described_class.new(user: manager, workspace: workspace).call }

      let(:manager) { create(:user, workspace: workspace, department: department, role: :department_manager) }

      it 'sees every ticket in their own department, regardless of who created it' do
        create(:ticket, workspace: workspace, department: department, status: :open)
        create(:ticket, workspace: workspace, department: other_dept, status: :open)

        expect(result.data[:total]).to eq(1)
      end

      it 'breaks down by status and priority' do
        create(:ticket, workspace: workspace, department: department, status: :open, priority: :high)
        create(:ticket, workspace: workspace, department: department, status: :resolved, priority: :low)

        expect(result.data[:by_status]['open']).to eq(1)
        expect(result.data[:by_priority]['high']).to eq(1)
      end
    end

    context 'as workspace_admin' do
      subject(:result) { described_class.new(user: admin, workspace: workspace).call }

      let(:admin) { create(:user, workspace: workspace, department: department, role: :workspace_admin) }

      it 'sees every ticket in the workspace, across all departments' do
        create(:ticket, workspace: workspace, department: department, status: :open)
        create(:ticket, workspace: workspace, department: other_dept, status: :open)

        expect(result.data[:total]).to eq(2)
      end
    end
  end
end
