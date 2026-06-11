# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Workflows::EvaluateRules do
  let(:workspace) { create(:workspace) }
  let(:user) { create(:user, workspace: workspace) }
  let(:ticket) do
    create(:ticket,
           workspace:     workspace,
           created_by:    user,
           status:        :open,
           priority:      :medium,
           urgency_score: 90.0,
           assigned_to:   nil)
  end

  let(:rule) do
    create(:workflow_rule,
           workspace:     workspace,
           trigger_event: :ticket_created,
           active:        true,
           conditions: [
             { 'field' => 'urgency_score', 'operator' => 'gte', 'value' => '85' },
             { 'field' => 'status',        'operator' => 'eq',  'value' => 'open' }
           ],
           actions: [
             { 'type' => 'escalate_priority', 'priority' => 'high' }
           ])
  end

  before { rule }

  describe '.call' do
    context 'when conditions are met' do
      it 'returns success' do
        result = described_class.call(ticket: ticket, event: :ticket_created)
        expect(result).to be_success
      end

      it 'creates a WorkflowExecution' do
        expect { described_class.call(ticket: ticket, event: :ticket_created) }
          .to change(WorkflowExecution, :count).by(1)
      end

      it 'escalates ticket priority' do
        described_class.call(ticket: ticket, event: :ticket_created)
        expect(ticket.reload.priority).to eq('high')
      end

      it 'increments rule execution_count' do
        described_class.call(ticket: ticket, event: :ticket_created)
        expect(rule.reload.execution_count).to eq(1)
      end

      it 'logs steps in WorkflowExecution' do
        described_class.call(ticket: ticket, event: :ticket_created)
        execution = WorkflowExecution.last
        expect(execution.steps_log['steps']).to be_an(Array)
        expect(execution.steps_log['steps'].first['action']).to eq('escalate_priority')
      end
    end

    context 'when conditions are not met' do
      before { ticket.update_columns(urgency_score: 50.0) }

      it 'does not create a WorkflowExecution' do
        expect { described_class.call(ticket: ticket, event: :ticket_created) }
          .not_to change(WorkflowExecution, :count)
      end
    end

    context 'when event does not match rule trigger' do
      it 'does not create a WorkflowExecution' do
        expect { described_class.call(ticket: ticket, event: :sla_breach) }
          .not_to change(WorkflowExecution, :count)
      end
    end

    context 'notify_user action' do
      let(:rule) do
        create(:workflow_rule,
               workspace:     workspace,
               trigger_event: :ticket_created,
               active:        true,
               conditions: [{ 'field' => 'urgency_score', 'operator' => 'gte', 'value' => '85' }],
               actions:    [{ 'type' => 'notify_user', 'body' => 'Your ticket is being reviewed.' }])
      end

      it 'creates a notification for the requester' do
        expect { described_class.call(ticket: ticket, event: :ticket_created) }
          .to change(Notification, :count).by(1)
        expect(Notification.last.user).to eq(user)
      end
    end
  end
end
