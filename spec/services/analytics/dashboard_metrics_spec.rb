# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::DashboardMetrics do
  let(:workspace) { create(:workspace) }

  describe '.call — employee role' do
    let(:user) { create(:user, workspace: workspace, role: :employee) }

    it 'returns success' do
      result = described_class.call(user: user, workspace: workspace)
      expect(result).to be_success
    end

    it 'returns employee role metrics' do
      result = described_class.call(user: user, workspace: workspace)
      expect(result.data[:role]).to eq('employee')
    end

    it 'includes tickets, leave_requests, onboarding, notifications keys' do
      result = described_class.call(user: user, workspace: workspace)
      expect(result.data.keys).to include(:tickets, :leave_requests, :onboarding, :notifications)
    end

    it 'counts only the user own open tickets' do
      create(:ticket, workspace: workspace, created_by: user, status: :open)
      other_user = create(:user, workspace: workspace, role: :employee)
      create(:ticket, workspace: workspace, created_by: other_user, status: :open)

      result = described_class.call(user: user, workspace: workspace)
      expect(result.data.dig(:tickets, :open)).to eq(1)
    end
  end

  describe '.call — manager role' do
    let(:user) { create(:user, workspace: workspace, role: :it_manager) }

    it 'returns manager role metrics' do
      result = described_class.call(user: user, workspace: workspace)
      expect(result.data[:role]).to eq('manager')
    end

    it 'includes kpis, ticket_volume_30d, heatmap, agent_performance keys' do
      result = described_class.call(user: user, workspace: workspace)
      expect(result.data.keys).to include(:kpis, :ticket_volume_30d, :heatmap, :agent_performance)
    end

    it 'returns 30 days of volume data' do
      result = described_class.call(user: user, workspace: workspace)
      expect(result.data[:ticket_volume_30d].length).to eq(30)
    end

    it 'returns heatmap with 168 cells (7 days x 24 hours)' do
      result = described_class.call(user: user, workspace: workspace)
      expect(result.data[:heatmap].length).to eq(168)
    end
  end

  describe '.call — executive role' do
    let(:user) { create(:user, workspace: workspace, role: :operations_manager) }

    it 'returns executive role metrics' do
      result = described_class.call(user: user, workspace: workspace)
      expect(result.data[:role]).to eq('executive')
    end

    it 'includes kpis, ticket_volume_30d, tickets_by_department keys' do
      result = described_class.call(user: user, workspace: workspace)
      expect(result.data.keys).to include(:kpis, :ticket_volume_30d, :tickets_by_department)
    end

    it 'calculates ai_operations_cost as a float' do
      result = described_class.call(user: user, workspace: workspace)
      expect(result.data.dig(:kpis, :ai_operations_cost)).to be_a(Float)
    end
  end

  describe '.call — sla_compliance_percent' do
    let(:user)  { create(:user, workspace: workspace, role: :it_manager) }
    let(:agent) { create(:user, workspace: workspace, role: :agent) }

    it 'returns 100.0 when no resolved tickets exist' do
      result = described_class.call(user: user, workspace: workspace)
      expect(result.data.dig(:kpis, :sla_compliance)).to eq(100.0)
    end

    it 'calculates correct compliance when tickets exist' do
      t1 = create(:ticket, workspace: workspace, created_by: user, status: :resolved,
                  due_at: 1.hour.from_now, resolved_at: Time.current)
      t2 = create(:ticket, workspace: workspace, created_by: user, status: :resolved,
                  due_at: 1.hour.ago, resolved_at: Time.current)
      t1.update_columns(status: 4, resolved_at: t1.due_at - 1.minute)
      t2.update_columns(status: 4, resolved_at: t2.due_at + 1.hour)

      result = described_class.call(user: user, workspace: workspace)
      expect(result.data.dig(:kpis, :sla_compliance)).to eq(50.0)
    end
  end
end
