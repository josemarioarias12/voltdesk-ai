# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SlaPredictorJob do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:sla_policy) { create(:sla_policy, workspace: workspace, resolution_hours: 8) }
  let(:agent)      { create(:user, :agent, workspace: workspace, department: department) }

  let!(:open_ticket) do
    create(:ticket,
           workspace:     workspace,
           department:    department,
           assigned_to:   agent,
           sla_policy:    sla_policy,
           status:        :open,
           due_at:        2.hours.from_now,
           urgency_score: 88)
  end

  let(:success_result) { ServiceResult.success(probability: 0.85, level: :critical, ticket_id: open_ticket.id) }

  describe '#perform' do
    before { allow(Ai::SlaRiskScorer).to receive(:call).and_return(success_result) }

    it 'calls SlaRiskScorer for each open ticket with a due_at' do
      expect(Ai::SlaRiskScorer).to receive(:call).with(ticket: open_ticket)
      described_class.new.perform(workspace.id)
    end

    context 'when ticket is resolved (not open_tickets scope)' do
      before { open_ticket.update!(status: :resolved) }

      it 'does not process resolved tickets' do
        expect(Ai::SlaRiskScorer).not_to receive(:call)
        described_class.new.perform(workspace.id)
      end
    end

    context 'when ticket has no due_at' do
      before { open_ticket.update_columns(due_at: nil) }

      it 'skips tickets without a due date' do
        expect(Ai::SlaRiskScorer).not_to receive(:call)
        described_class.new.perform(workspace.id)
      end
    end

    context 'when SlaRiskScorer returns failure' do
      before { allow(Ai::SlaRiskScorer).to receive(:call).and_return(ServiceResult.failure('scoring error')) }

      it 'logs a warning and continues without raising' do
        expect { described_class.new.perform(workspace.id) }.not_to raise_error
      end
    end

    context 'when SlaRiskScorer raises an unexpected error' do
      before { allow(Ai::SlaRiskScorer).to receive(:call).and_raise(StandardError, 'boom') }

      it 'rescues the error and continues without raising' do
        expect { described_class.new.perform(workspace.id) }.not_to raise_error
      end
    end

    context 'when no workspace_id is given' do
      it 'processes all workspaces' do
        second_workspace = create(:workspace)
        create(:ticket,
               workspace:  second_workspace,
               department: create(:department, workspace: second_workspace),
               status:     :open,
               due_at:     3.hours.from_now)

        expect(Ai::SlaRiskScorer).to receive(:call).at_least(:twice)
        described_class.new.perform
      end
    end
  end
end
