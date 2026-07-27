# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::LeaveRequestsOverview do
  let(:workspace)   { create(:workspace) }
  let(:department)  { create(:department, workspace: workspace) }
  let(:other_dept)  { create(:department, workspace: workspace) }

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

      it 'only counts their own requests' do
        create(:leave_request, workspace: workspace, user: employee, department: department)
        other = create(:user, workspace: workspace, department: department)
        create(:leave_request, workspace: workspace, user: other, department: department)

        expect(result.data[:total]).to eq(1)
      end
    end

    context 'as it_manager — not part of the HR-wide tier' do
      subject(:result) { described_class.new(user: it_manager, workspace: workspace).call }

      let(:it_manager) { create(:user, workspace: workspace, department: department, role: :it_manager) }

      it 'only sees their own requests, unlike TicketsOverview where this role sees everything' do
        create(:leave_request, workspace: workspace, user: it_manager, department: department)
        other = create(:user, workspace: workspace, department: department)
        create(:leave_request, workspace: workspace, user: other, department: department)

        expect(result.data[:total]).to eq(1)
      end
    end

    context 'as department_manager' do
      subject(:result) { described_class.new(user: manager, workspace: workspace).call }

      let(:manager) { create(:user, workspace: workspace, department: department, role: :department_manager) }

      it 'sees every request in their own department, regardless of requester' do
        create(:leave_request, workspace: workspace, department: department,
                                user: create(:user, workspace: workspace, department: department))
        create(:leave_request, workspace: workspace, department: other_dept,
                                user: create(:user, workspace: workspace, department: other_dept))

        expect(result.data[:total]).to eq(1)
      end

      it 'reports pending_count using the pending_approval scope' do
        create(:leave_request, workspace: workspace, department: department, status: :pending,
                                user: create(:user, workspace: workspace, department: department))
        create(:leave_request, workspace: workspace, department: department, status: :approved,
                                user: create(:user, workspace: workspace, department: department))

        expect(result.data[:pending_count]).to eq(1)
      end
    end

    context 'as hr_manager' do
      subject(:result) { described_class.new(user: hr, workspace: workspace).call }

      let(:hr) { create(:user, workspace: workspace, department: department, role: :hr_manager) }

      it 'sees every request in the workspace, across all departments' do
        create(:leave_request, workspace: workspace, department: department,
                                user: create(:user, workspace: workspace, department: department))
        create(:leave_request, workspace: workspace, department: other_dept,
                                user: create(:user, workspace: workspace, department: other_dept))

        expect(result.data[:total]).to eq(2)
      end
    end

    context 'as workspace_admin' do
      subject(:result) { described_class.new(user: admin, workspace: workspace).call }

      let(:admin) { create(:user, workspace: workspace, department: department, role: :workspace_admin) }

      it 'sees every request in the workspace, same as hr_manager' do
        create(:leave_request, workspace: workspace, department: department,
                                user: create(:user, workspace: workspace, department: department))
        create(:leave_request, workspace: workspace, department: other_dept,
                                user: create(:user, workspace: workspace, department: other_dept))

        expect(result.data[:total]).to eq(2)
      end
    end
  end
end
