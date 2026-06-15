# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::AiHealthMetrics do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace) }

  def create_log(overrides = {})
    create(:ai_audit_log, {
      workspace:        workspace,
      user:             user,
      operation:        :ticket_classification,
      model:            'gpt-4o',
      provider:         'openai',
      prompt:           'classify this',
      response:         '{}',
      prompt_tokens:    100,
      completion_tokens: 50,
      duration_ms:      800,
      confidence_score: 0.85,
      status:           :success
    }.merge(overrides))
  end

  describe '#call' do
    context 'with sufficient data' do
      subject(:result) { described_class.new(workspace: workspace, period_days: 7).call }

      before do
        create_log(confidence_score: 0.90, status: :success)
        create_log(confidence_score: 0.65, status: :success, operation: :response_suggestion)
        create_log(confidence_score: 0.25, status: :error,   operation: :asset_risk_scoring)
        create_log(confidence_score: 0.45, status: :success, operation: :survey_analysis)
      end

      it 'returns success' do
        expect(result).to be_success
      end

      it 'includes all required keys' do
        expect(result.data.keys).to contain_exactly(
          :confidence_distribution,
          :operations_below_threshold,
          :cost_per_operation,
          :estimated_time_saved,
          :top_failing_operations,
          :total_operations,
          :period_days,
          :success_rate
        )
      end

      it 'counts total operations correctly' do
        expect(result.data[:total_operations]).to eq(4)
      end

      it 'builds confidence distribution histogram' do
        dist = result.data[:confidence_distribution]
        expect(dist['0.0-0.3']).to eq(1)
        expect(dist['0.3-0.5']).to eq(1)
        expect(dist['0.5-0.7']).to eq(1)
        expect(dist['0.7-1.0']).to eq(1)
      end

      it 'identifies operations below threshold' do
        ops = result.data[:operations_below_threshold]
        operation_names = ops.pluck(:operation)
        expect(operation_names).to include('response_suggestion', 'survey_analysis', 'asset_risk_scoring')
      end

      it 'includes recommendations for below-threshold operations' do
        ops = result.data[:operations_below_threshold]
        ops.each do |op|
          expect(op[:recommendation]).to be_present
        end
      end

      it 'calculates estimated time saved' do
        expect(result.data[:estimated_time_saved]).to be > 0
      end

      it 'calculates success rate' do
        expect(result.data[:success_rate]).to eq(75.0)
      end

      it 'identifies top failing operations' do
        failing = result.data[:top_failing_operations]
        expect(failing.pluck(:operation)).to include('asset_risk_scoring')
      end

      it 'includes cost per operation' do
        costs = result.data[:cost_per_operation]
        expect(costs).to all(include(:operation, :avg_cost, :total))
      end
    end

    context 'with no data in period' do
      before do
        create_log(created_at: 30.days.ago)
      end

      it 'returns success with zero operations' do
        result = described_class.new(workspace: workspace, period_days: 7).call
        expect(result).to be_success
        expect(result.data[:total_operations]).to eq(0)
      end
    end

    context 'with data from another workspace' do
      let(:other_workspace) { create(:workspace) }
      let(:other_user)      { create(:user, workspace: other_workspace) }

      before do
        create(:ai_audit_log,
               workspace: other_workspace, user: other_user,
               operation: :ticket_classification, model: 'gpt-4o',
               provider: 'openai', prompt: 'x', response: 'y',
               prompt_tokens: 10, completion_tokens: 5,
               duration_ms: 100, confidence_score: 0.9, status: :success)
        create_log(confidence_score: 0.6)
      end

      it 'only counts logs for the current workspace' do
        result = described_class.new(workspace: workspace, period_days: 7).call
        expect(result.data[:total_operations]).to eq(1)
      end
    end
  end
end
