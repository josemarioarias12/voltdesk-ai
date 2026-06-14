# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SlaPredictorJob do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:sla_policy) { create(:sla_policy, workspace: workspace, resolution_hours: 8) }
  let(:agent)      { create(:user, :agent, workspace: workspace, department: department) }

  let!(:open_ticket) do
    create(:ticket,
           workspace:    workspace,
           department:   department,
           assigned_to:  agent,
           sla_policy:   sla_policy,
           status:       :open,
           due_at:       2.hours.from_now,
           urgency_score: 88)
  end

  let(:high_risk_result) do
    ServiceResult.success(
      probability:          0.85,
      contributing_factors: ['High urgency', 'Imminent deadline'],
      reasoning:            'Ticket is high risk.',
      ticket_id:            open_ticket.id,
      at_risk:              true
    )
  end

  let(:low_risk_result) do
    ServiceResult.success(
      probability:          0.30,
      contributing_factors: ['Low urgency'],
      reasoning:            'Ticket is on track.',
      ticket_id:            open_ticket.id,
      at_risk:              false
    )
  end

  describe '#perform' do
    context 'when ticket is at risk (probability >= 0.70)' do
      before do
        allow(Ai::SlaPredictor).to receive(:call).and_return(high_risk_result)
        allow(Ai::SlaNotifier).to  receive(:call).and_return(ServiceResult.success({}))
      end

      it 'calls SlaPredictor for each open ticket' do
        expect(Ai::SlaPredictor).to receive(:call).with(ticket: open_ticket)
        described_class.new.perform(workspace.id)
      end

      it 'calls SlaNotifier when ticket is at risk' do
        expect(Ai::SlaNotifier).to receive(:call).with(
          ticket:               open_ticket,
          probability:          0.85,
          contributing_factors: ['High urgency', 'Imminent deadline']
        )
        described_class.new.perform(workspace.id)
      end
    end

    context 'when ticket is not at risk (probability < 0.70)' do
      before do
        allow(Ai::SlaPredictor).to receive(:call).and_return(low_risk_result)
      end

      it 'does not call SlaNotifier' do
        expect(Ai::SlaNotifier).not_to receive(:call)
        described_class.new.perform(workspace.id)
      end
    end

    context 'when ticket was recently predicted (within cooldown)' do
      before do
        open_ticket.update_columns(sla_predicted_at: 10.minutes.ago)
        allow(Ai::SlaPredictor).to receive(:call).and_return(high_risk_result)
      end

      it 'skips recently predicted tickets' do
        expect(Ai::SlaPredictor).not_to receive(:call)
        described_class.new.perform(workspace.id)
      end
    end

    context 'when ticket is resolved (not open_tickets scope)' do
      before do
        open_ticket.update!(status: :resolved)
        allow(Ai::SlaPredictor).to receive(:call).and_return(high_risk_result)
      end

      it 'does not process resolved tickets' do
        expect(Ai::SlaPredictor).not_to receive(:call)
        described_class.new.perform(workspace.id)
      end
    end

    context 'when SlaPredictor returns failure' do
      before do
        allow(Ai::SlaPredictor).to receive(:call).and_return(ServiceResult.failure('API error'))
      end

      it 'does not call SlaNotifier and continues processing' do
        expect(Ai::SlaNotifier).not_to receive(:call)
        expect { described_class.new.perform(workspace.id) }.not_to raise_error
      end
    end

    context 'when no workspace_id is given' do
      before do
        allow(Ai::SlaPredictor).to receive(:call).and_return(low_risk_result)
      end

      it 'processes all workspaces' do
        second_workspace = create(:workspace)
        create(:ticket, workspace: second_workspace,
               department: create(:department, workspace: second_workspace),
               status: :open, due_at: 3.hours.from_now)

        expect(Ai::SlaPredictor).to receive(:call).at_least(:twice)
        described_class.new.perform
      end
    end
  end
end
