# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::SlaRiskScorer do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:sla_policy) { create(:sla_policy, workspace: workspace, resolution_hours: 8) }
  let(:agent)      { create(:user, :agent, workspace: workspace, department: department) }
  let(:adapter)    { instance_double(Ai::Providers::OpenaiAdapter) }

  before do
    allow(Ai::Providers::OpenaiAdapter).to receive(:new).and_return(adapter)
    allow(adapter).to receive(:chat).and_return(content: 'Reasoning text.', tokens: { 'total_tokens' => 42 })
    allow(TelegramNotifier).to receive(:send_prediction)
    allow(Ai::SlaNotifier).to receive(:call).and_return(ServiceResult.success({}))
  end

  def build_ticket(**overrides)
    create(:ticket, {
      workspace:     workspace,
      department:    department,
      sla_policy:    sla_policy,
      assigned_to:   agent,
      status:        :open,
      urgency_score: 50,
      due_at:        4.hours.from_now
    }.merge(overrides))
  end

  describe '.call' do
    context 'when ticket has no due_at' do
      it 'skips without calculating a score' do
        ticket = build_ticket
        ticket.update_column(:due_at, nil)
        result = described_class.call(ticket: ticket)

        expect(result).to be_success
        expect(result.data[:skipped]).to eq(:no_due_at)
      end
    end

    context 'when ticket already breached SLA' do
      it 'skips without calculating a score' do
        ticket = build_ticket(due_at: 1.hour.ago)
        result = described_class.call(ticket: ticket)

        expect(result).to be_success
        expect(result.data[:skipped]).to eq(:already_breached)
      end
    end

    context 'deterministic scoring' do
      it 'produces a higher probability for tickets closer to their deadline' do
        near_deadline = build_ticket(due_at: 30.minutes.from_now)
        far_deadline  = build_ticket(due_at: 7.hours.from_now)

        near_result = described_class.call(ticket: near_deadline)
        far_result  = described_class.call(ticket: far_deadline)

        expect(near_result.data[:probability]).to be > far_result.data[:probability]
      end

      it 'produces a higher probability for higher urgency scores' do
        low_urgency  = build_ticket(urgency_score: 10, due_at: 4.hours.from_now)
        high_urgency = build_ticket(urgency_score: 95, due_at: 4.hours.from_now)

        low_result  = described_class.call(ticket: low_urgency)
        high_result = described_class.call(ticket: high_urgency)

        expect(high_result.data[:probability]).to be > low_result.data[:probability]
      end

      it 'never returns a probability outside 0.0..1.0' do
        ticket = build_ticket(urgency_score: 100, due_at: 1.minute.from_now)
        result = described_class.call(ticket: ticket)

        expect(result.data[:probability]).to be_between(0.0, 1.0)
      end

      it 'is reproducible for the same inputs' do
        ticket = build_ticket(urgency_score: 70, due_at: 2.hours.from_now)

        freeze_time do
          first  = described_class.call(ticket: ticket).data[:probability]
          second = described_class.call(ticket: ticket).data[:probability]

          expect(first).to eq(second)
        end
      end
    end

    context 'persistence' do
      it 'persists probability and prediction timestamp on the ticket' do
        ticket = build_ticket
        described_class.call(ticket: ticket)

        ticket.reload
        expect(ticket.sla_breach_probability).not_to be_nil
        expect(ticket.sla_predicted_at).not_to be_nil
      end

      it 'updates sla_risk_level only when the level actually changes' do
        ticket = build_ticket(urgency_score: 95, due_at: 10.minutes.from_now)

        expect { described_class.call(ticket: ticket) }
          .to change { ticket.reload.sla_risk_level }.from('none')

        changed_at = ticket.reload.sla_risk_level_changed_at
        described_class.call(ticket: ticket)

        expect(ticket.reload.sla_risk_level_changed_at).to eq(changed_at)
      end
    end

    context 'notification hysteresis' do
      it 'notifies once when crossing into at_risk' do
        ticket = build_ticket(urgency_score: 90, due_at: 20.minutes.from_now)

        expect(TelegramNotifier).to receive(:send_prediction).once
        described_class.call(ticket: ticket)
      end

      it 'does not re-notify on a second call at the same risk level' do
        ticket = build_ticket(urgency_score: 90, due_at: 20.minutes.from_now)

        described_class.call(ticket: ticket)
        expect(TelegramNotifier).not_to receive(:send_prediction)
        described_class.call(ticket: ticket)
      end

      it 're-notifies when the risk level increases' do
        ticket = build_ticket(urgency_score: 60, due_at: 3.hours.from_now)
        described_class.call(ticket: ticket)

        ticket.update_columns(urgency_score: 95, due_at: 5.minutes.from_now)
        expect(TelegramNotifier).to receive(:send_prediction).once
        described_class.call(ticket: ticket)
      end

      it 'does not notify at all for watch level or below' do
        ticket = build_ticket(urgency_score: 20, due_at: 7.hours.from_now)

        expect(TelegramNotifier).not_to receive(:send_prediction)
        described_class.call(ticket: ticket)
      end

      it 'also calls Ai::SlaNotifier when a notification is due' do
        ticket = build_ticket(urgency_score: 90, due_at: 20.minutes.from_now)

        described_class.call(ticket: ticket)

        expect(Ai::SlaNotifier).to have_received(:call)
          .with(ticket: ticket, probability: kind_of(Float), reasoning: kind_of(String))
      end
    end

    context 'when the AI adapter fails while generating reasoning' do
      before { allow(adapter).to receive(:chat).and_raise(StandardError, 'timeout') }

      it 'still notifies with a default reasoning, without raising' do
        ticket = build_ticket(urgency_score: 90, due_at: 20.minutes.from_now)

        expect { described_class.call(ticket: ticket) }.not_to raise_error
        expect(TelegramNotifier).to have_received(:send_prediction)
      end
    end

    context 'when the agent has no open tickets factored in' do
      it 'still succeeds without an assigned agent' do
        ticket = build_ticket(assigned_to: nil)
        result = described_class.call(ticket: ticket)

        expect(result).to be_success
      end
    end
  end
end
