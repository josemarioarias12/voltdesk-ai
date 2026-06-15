# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::WorkspaceBenchmark do
  let!(:workspace)       { create(:workspace, plan: 'professional', active: true) }
  let!(:workspace_two)   { create(:workspace, plan: 'professional', active: true) }
  let!(:workspace_three) { create(:workspace, plan: 'professional', active: true) }

  let(:dept)       { create(:department, workspace: workspace) }
  let(:dept_two)   { create(:department, workspace: workspace_two) }
  let(:dept_three) { create(:department, workspace: workspace_three) }

  let(:user)       { create(:user, workspace: workspace) }
  let(:user_two)   { create(:user, workspace: workspace_two) }
  let(:user_three) { create(:user, workspace: workspace_three) }

  def create_tickets_for(wrk, dept_obj, usr, count: 10, resolved: true)
    count.times do
      create(:ticket,
             workspace:    wrk,
             department:   dept_obj,
             created_by:   usr,
             status:       resolved ? :resolved : :open,
             resolved_at:  resolved ? 2.hours.ago : nil,
             due_at:       resolved ? 3.hours.ago + 30.minutes : 3.hours.from_now)
    end
  end

  def create_logs_for(wrk, usr)
    3.times do
      create(:ai_audit_log,
             workspace:        wrk,
             user:             usr,
             operation:        :ticket_classification,
             model:            'gpt-4o',
             provider:         'openai',
             prompt:           'classify',
             response:         '{}',
             prompt_tokens:    100,
             completion_tokens: 50,
             duration_ms:      500,
             confidence_score: 0.85,
             status:           :success)
    end
  end

  before do
    create_tickets_for(workspace,       dept,       user)
    create_tickets_for(workspace_two,   dept_two,   user_two)
    create_tickets_for(workspace_three, dept_three, user_three)
    create_logs_for(workspace,       user)
    create_logs_for(workspace_two,   user_two)
    create_logs_for(workspace_three, user_three)
  end

  describe '#call' do
    subject(:result) { described_class.new(workspace: workspace).call }

    it 'returns success' do
      expect(result).to be_success
    end

    it 'includes required keys' do
      expect(result.data.keys).to contain_exactly(
        :current_workspace,
        :percentiles,
        :peer_percentiles,
        :peer_count,
        :total_count,
        :plan,
        :period_days
      )
    end

    it 'returns percentile for each metric' do
      expect(result.data[:percentiles].keys).to contain_exactly(
        :sla_compliance,
        :avg_resolution_hrs,
        :avg_confidence,
        :cost_per_ticket
      )
    end

    it 'each percentile has value and percentile keys' do
      result.data[:percentiles].each_value do |metric|
        expect(metric).to include(:value, :percentile)
      end
    end

    it 'percentile is between 0 and 100' do
      result.data[:percentiles].each_value do |metric|
        expect(metric[:percentile]).to be_between(0, 100)
      end
    end

    it 'does not expose workspace identifiers' do
      current = result.data[:current_workspace]
      expect(current).not_to have_key(:workspace_id)
    end

    it 'marks current workspace as own' do
      expect(result.data[:current_workspace][:is_current]).to be true
    end

    it 'returns correct plan' do
      expect(result.data[:plan]).to eq('professional')
    end

    context 'with insufficient workspaces' do
      before do
        Workspace.where.not(id: workspace.id).update_all(active: false)
      end

      it 'returns failure' do
        result = described_class.new(workspace: workspace).call
        expect(result).to be_failure
        expect(result.error).to be_present
      end
    end
  end
end
