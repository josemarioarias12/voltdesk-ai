# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::AnomalyDetector do
  let(:workspace) { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }

  let(:gpt_response) do
    {
      'choices' => [{
        'message' => {
          'content' => 'Multiple employees reporting VPN connectivity issues after recent update.'
        }
      }],
      'usage' => { 'prompt_tokens' => 150, 'completion_tokens' => 20 }
    }
  end

  before do
    allow_any_instance_of(OpenAI::Client).to receive(:chat).and_return(gpt_response)
  end

  describe '.call' do
    context 'when ticket volume is within normal range' do
      before do
        # Seed 30 days of baseline: 2 tickets/day
        30.times do |days_ago|
          2.times do
            create(:ticket,
                   workspace:   workspace,
                   department:  department,
                   created_at:  (days_ago + 1).days.ago)
          end
        end
      end

      it 'returns success with no alerts created' do
        # Current window: 2 tickets — within baseline
        create_list(:ticket, 2, workspace: workspace, department: department,
                    created_at: 30.minutes.ago)

        result = described_class.call(workspace: workspace)

        expect(result).to be_success
        expect(result.data[:alerts_created]).to be_empty
      end
    end

    context 'when ticket volume exceeds Z-score threshold' do
      before do
        # Deterministic baseline: alternating 1 and 3 tickets/day → mean=2, std_dev=1.0
        30.times do |days_ago|
          count = days_ago.even? ? 1 : 3
          count.times do
            create(:ticket,
                   workspace:  workspace,
                   department: department,
                   created_at: (days_ago + 1).days.ago)
          end
        end
      end

      it 'creates a PatternAlert with department_surge type' do
        # 20 tickets in 60 minutes = clear anomaly
        create_list(:ticket, 20, workspace: workspace, department: department,
                    created_at: 30.minutes.ago)

        expect do
          described_class.call(workspace: workspace)
        end.to change(PatternAlert, :count).by(1)

        alert = PatternAlert.last
        expect(alert.alert_type).to eq('department_surge')
        expect(alert.workspace).to eq(workspace)
        expect(alert.metadata['department_id']).to eq(department.id)
        expect(alert.metadata['alert_source']).to eq('anomaly_detector')
      end

      it 'calculates severity based on Z-score magnitude' do
        create_list(:ticket, 20, workspace: workspace, department: department,
                    created_at: 30.minutes.ago)

        described_class.call(workspace: workspace)

        alert = PatternAlert.last
        expect(alert.severity).to be_in(%w[medium high critical])
      end

      it 'stores zscore and baseline stats in metadata' do
        create_list(:ticket, 20, workspace: workspace, department: department,
                    created_at: 30.minutes.ago)

        described_class.call(workspace: workspace)

        metadata = PatternAlert.last.metadata
        expect(metadata['zscore']).to be > Ai::AnomalyDetector::ZSCORE_THRESHOLD
        expect(metadata['baseline_mean']).to be_a(Float)
        expect(metadata['baseline_std']).to be_a(Float)
        expect(metadata['ticket_ids']).to be_an(Array)
      end

      it 'does not create duplicate alerts within 2 hours' do
        create_list(:ticket, 20, workspace: workspace, department: department,
                    created_at: 30.minutes.ago)

        described_class.call(workspace: workspace)
        expect do
          described_class.call(workspace: workspace)
        end.not_to change(PatternAlert, :count)
      end
    end

    context 'when department has insufficient baseline data' do
      it 'returns success with no alerts (std_dev too low)' do
        # Only 1 ticket in history — std_dev will be 0
        create(:ticket, workspace: workspace, department: department,
               created_at: 15.days.ago)

        result = described_class.call(workspace: workspace)

        expect(result).to be_success
        expect(result.data[:alerts_created]).to be_empty
      end
    end

    context 'when OpenAI raises an error during topic clustering' do
      before do
        allow_any_instance_of(OpenAI::Client).to receive(:chat).and_raise(StandardError, 'timeout')

        30.times do |days_ago|
          count = days_ago.even? ? 1 : 3
          count.times do
            create(:ticket, workspace: workspace, department: department,
                   created_at: (days_ago + 1).days.ago)
          end
        end
        create_list(:ticket, 20, workspace: workspace, department: department,
                    created_at: 30.minutes.ago)
      end

      it 'falls back to title summary and still creates the alert' do
        expect do
          described_class.call(workspace: workspace)
        end.to change(PatternAlert, :count).by(1)

        expect(PatternAlert.last.description).to be_present
      end
    end
  end
end
