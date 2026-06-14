# frozen_string_literal: true

require 'rails_helper'
RSpec.describe Ai::SlaPredictor do
  include ActiveSupport::Testing::TimeHelpers

  let(:workspace)   { create(:workspace) }
  let(:department)  { create(:department, workspace: workspace) }
  let(:sla_policy)  { create(:sla_policy, workspace: workspace, resolution_hours: 8) }
  let(:agent)       { create(:user, :agent, workspace: workspace, department: department) }
  let(:ticket) do
    create(:ticket,
           workspace:   workspace,
           department:  department,
           assigned_to: agent,
           sla_policy:  sla_policy,
           urgency_score: 85,
           due_at:      2.hours.from_now,
           status:      :open)
  end

  let(:gpt_response) do
    {
      'choices' => [{
        'message' => {
          'content' => {
            probability:          0.82,
            contributing_factors: ['High urgency score', 'Low hours until due', 'Agent overloaded'],
            reasoning:            'Ticket has high urgency and deadline is imminent.'
          }.to_json
        }
      }],
      'usage' => { 'prompt_tokens' => 200, 'completion_tokens' => 80 }
    }
  end

  before do
    allow_any_instance_of(OpenAI::Client).to receive(:chat).and_return(gpt_response)
  end

  describe '.call' do
    context 'when GPT returns valid prediction' do
      it 'returns success with probability and contributing factors' do
        result = described_class.call(ticket: ticket)

        expect(result).to be_success
        expect(result.data[:probability]).to eq(0.82)
        expect(result.data[:contributing_factors]).to include('High urgency score')
        expect(result.data[:at_risk]).to be true
      end

      it 'persists sla_breach_probability on the ticket' do
        described_class.call(ticket: ticket)

        expect(ticket.reload.sla_breach_probability).to eq(0.82)
        expect(ticket.reload.sla_predicted_at).to be_within(5.seconds).of(Time.current)
      end

      it 'marks at_risk false when probability is below threshold' do
        low_response = gpt_response.deep_dup
        low_response['choices'][0]['message']['content'] = {
          probability:          0.45,
          contributing_factors: ['Low urgency'],
          reasoning:            'Ticket is on track.'
        }.to_json

        allow_any_instance_of(OpenAI::Client).to receive(:chat).and_return(low_response)

        result = described_class.call(ticket: ticket)

        expect(result).to be_success
        expect(result.data[:at_risk]).to be false
        expect(result.data[:probability]).to eq(0.45)
      end
    end

    context 'when ticket has no assigned agent' do
      let(:ticket) do
        create(:ticket,
               workspace:    workspace,
               department:   department,
               assigned_to:  nil,
               sla_policy:   sla_policy,
               urgency_score: 70,
               due_at:       1.hour.from_now,
               status:       :open)
      end

      it 'defaults agent_avg_resolution_hours to 24.0 and still succeeds' do
        result = described_class.call(ticket: ticket)
        expect(result).to be_success
      end
    end

    context 'when ticket is already past due' do
      let(:ticket) do
        create(:ticket,
               workspace:    workspace,
               department:   department,
               assigned_to:  agent,
               sla_policy:   sla_policy,
               urgency_score: 90,
               due_at:       1.hour.ago,
               status:       :open)
      end

      it 'sends hours_until_due as 0.0 in the prompt' do
        expect_any_instance_of(OpenAI::Client).to receive(:chat) do |_, params|
          prompt = params[:parameters][:messages].first[:content]
          expect(prompt).to include('0.0')
          gpt_response
        end

        described_class.call(ticket: ticket)
      end
    end

    context 'when GPT returns malformed JSON' do
      before do
        bad_response = gpt_response.deep_dup
        bad_response['choices'][0]['message']['content'] = 'not json at all'
        allow_any_instance_of(OpenAI::Client).to receive(:chat).and_return(bad_response)
      end

      it 'returns success with fallback probability 0.5' do
        result = described_class.call(ticket: ticket)
        expect(result).to be_success
        expect(result.data[:probability]).to eq(0.5)
        expect(result.data[:contributing_factors]).to include('parse_error')
      end
    end

    context 'when OpenAI raises an error' do
      before do
        allow_any_instance_of(OpenAI::Client).to receive(:chat).and_raise(StandardError, 'API timeout')
      end

      it 'returns failure with error message' do
        result = described_class.call(ticket: ticket)
        expect(result).to be_failure
        expect(result.error).to include('API timeout')
      end
    end
  end
end
