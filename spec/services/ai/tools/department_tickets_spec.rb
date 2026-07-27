# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::DepartmentTickets do
  let(:workspace)   { create(:workspace) }
  let(:department)  { create(:department, workspace: workspace) }
  let(:other_dept)  { create(:department, workspace: workspace) }

  describe '.visible_to?' do
    it 'is visible to department_manager and agent' do
      expect(described_class.visible_to?(build(:user, role: :department_manager))).to be(true)
      expect(described_class.visible_to?(build(:user, role: :agent))).to be(true)
    end

    it 'is not visible to employee or guest' do
      expect(described_class.visible_to?(build(:user, role: :employee))).to be(false)
      expect(described_class.visible_to?(build(:user, role: :guest))).to be(false)
    end
  end

  describe '#call' do
    context 'as department_manager' do
      subject(:result) { described_class.new(user: manager, workspace: workspace).call }

      let(:manager) { create(:user, workspace: workspace, department: department, role: :department_manager) }

      it 'returns success' do
        expect(result).to be_success
      end

      it 'only counts tickets from the manager own department' do
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

      it 'does not see tickets from other departments not assigned to them' do
        create(:ticket, workspace: workspace, department: other_dept, status: :open)

        expect(result.data[:total]).to eq(0)
      end
    end

    context 'reusing TicketPolicy::Scope as the real authorization boundary' do
      it 'never lets an employee see department-wide data, even if called directly' do
        employee = create(:user, workspace: workspace, department: department, role: :employee)
        create(:ticket, workspace: workspace, department: department, status: :open)
        create(:ticket, workspace: workspace, department: department, status: :open,
                                                 created_by: create(:user, workspace: workspace, department: department))

        result = described_class.new(user: employee, workspace: workspace).call

        expect(result.data[:total]).to eq(0)
      end
    end
  end
end
