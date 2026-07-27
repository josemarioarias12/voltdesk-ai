# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::WorkspacePatternAlerts do
  let(:workspace) { create(:workspace) }

  describe '.visible_to?' do
    it 'is visible only to workspace_admin and super_admin' do
      expect(described_class.visible_to?(build(:user, role: :workspace_admin))).to be(true)
      expect(described_class.visible_to?(build(:user, role: :super_admin))).to be(true)
    end

    it 'is not visible to hr_manager, it_manager, or any other role' do
      %i[hr_manager it_manager operations_manager facilities_manager department_manager
         agent employee guest].each do |role|
        expect(described_class.visible_to?(build(:user, role: role))).to be(false)
      end
    end
  end

  describe '#call' do
    subject(:result) { described_class.new(user: admin, workspace: workspace).call }

    let(:admin) { create(:user, workspace: workspace, role: :workspace_admin) }

    it 'returns success' do
      expect(result).to be_success
    end

    it 'only counts active (unresolved) alerts' do
      create(:pattern_alert, workspace: workspace, resolved_at: nil)
      create(:pattern_alert, workspace: workspace, resolved_at: Time.current)

      expect(result.data[:active_count]).to eq(1)
    end

    it 'breaks down by severity and alert_type' do
      create(:pattern_alert, workspace: workspace, severity: :critical, alert_type: :sla_spike)
      create(:pattern_alert, workspace: workspace, severity: :low, alert_type: :ticket_cluster)

      expect(result.data[:by_severity]['critical']).to eq(1)
      expect(result.data[:by_alert_type]['sla_spike']).to eq(1)
    end

    it 'reports critical_count using severity_critical' do
      create(:pattern_alert, workspace: workspace, severity: :critical)
      create(:pattern_alert, workspace: workspace, severity: :medium)

      expect(result.data[:critical_count]).to eq(1)
    end

    it 'never counts alerts from another workspace' do
      other_workspace = create(:workspace)
      create(:pattern_alert, workspace: other_workspace, resolved_at: nil)

      expect(result.data[:active_count]).to eq(0)
    end
  end
end
