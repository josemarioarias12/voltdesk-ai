# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::AssetsOverview do
  let(:workspace) { create(:workspace) }

  describe '.visible_to?' do
    it 'is visible to it_manager, operations_manager, workspace_admin, and super_admin' do
      %i[it_manager operations_manager workspace_admin super_admin].each do |role|
        expect(described_class.visible_to?(build(:user, role: role))).to be(true)
      end
    end

    it 'is not visible to any other role, including department_manager and hr_manager' do
      %i[super_admin workspace_admin hr_manager facilities_manager department_manager
         agent employee guest].each do |role|
        next if role.in?(%i[super_admin workspace_admin])

        expect(described_class.visible_to?(build(:user, role: role))).to be(false)
      end
    end

    it 'is not visible to an employee, unlike TicketsOverview and LeaveRequestsOverview' do
      expect(described_class.visible_to?(build(:user, role: :employee))).to be(false)
    end
  end

  describe '#call' do
    subject(:result) { described_class.new(user: it_manager, workspace: workspace).call }

    let(:it_manager) { create(:user, workspace: workspace, role: :it_manager) }

    it 'returns success' do
      expect(result).to be_success
    end

    it 'counts every asset in the workspace, with no per-user scoping' do
      create(:asset, workspace: workspace, status: :active)
      create(:asset, workspace: workspace, status: :retired)

      expect(result.data[:total]).to eq(2)
    end

    it 'breaks down by status and asset_type' do
      create(:asset, workspace: workspace, status: :active, asset_type: :laptop)
      create(:asset, workspace: workspace, status: :in_maintenance, asset_type: :monitor)

      expect(result.data[:by_status]['active']).to eq(1)
      expect(result.data[:by_asset_type]['laptop']).to eq(1)
    end

    it 'reports warranty_expiring_soon_count using the warranty_expiring scope' do
      create(:asset, workspace: workspace, warranty_expires_at: 10.days.from_now)
      create(:asset, workspace: workspace, warranty_expires_at: 90.days.from_now)

      expect(result.data[:warranty_expiring_soon_count]).to eq(1)
    end

    it 'reports high_risk_count using the high_risk scope' do
      create(:asset, workspace: workspace, risk_score: 85)
      create(:asset, workspace: workspace, risk_score: 20)

      expect(result.data[:high_risk_count]).to eq(1)
    end

    it 'does not scope by department or assigned_to, unlike Tickets/LeaveRequests' do
      other_dept = create(:department, workspace: workspace)
      create(:asset, workspace: workspace, department: other_dept)

      expect(result.data[:total]).to eq(1)
    end
  end
end
