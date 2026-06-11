# frozen_string_literal: true

require 'rails_helper'

# rubocop:disable RSpec/AnyInstance

RSpec.describe Ai::AgentOrchestrator do
  let(:workspace) do
    create(:workspace, settings: {
             'agent_threshold' => 80,
      'human_in_the_loop' => false
           })
  end
  let(:user)   { create(:user, workspace: workspace) }
  let(:ticket) do
    create(:ticket,
           workspace:     workspace,
           created_by:    user,
           category:      'it',
           urgency_score: 90,
           status:        :open)
  end

  before do
    create(:ticket_embedding, ticket: ticket)
    allow(ActionCable.server).to receive(:broadcast)
  end

  describe '.call' do
    context 'when category is not automatable' do
      before { ticket.update_columns(category: 'general') }

      it 'returns failure' do
        result = described_class.call(ticket: ticket)
        expect(result).to be_failure
        expect(result.error).to include('not automatable')
      end
    end

    context 'when confidence is below threshold' do
      before { ticket.update_columns(urgency_score: 50) }

      it 'returns failure' do
        result = described_class.call(ticket: ticket)
        expect(result).to be_failure
        expect(result.error).to include('below threshold')
      end
    end

    context 'when human_in_the_loop is true' do
      before do
        workspace.update!(settings: {
                            'agent_threshold' => 80,
        'human_in_the_loop' => true
                          })
      end

      it 'creates a pending_approval AgentAction' do
        expect { described_class.call(ticket: ticket) }
          .to change(AgentAction, :count).by(1)

        action = AgentAction.last
        expect(action).to be_status_pending_approval
        expect(action.ticket).to eq(ticket)
        expect(action.workspace).to eq(workspace)
      end

      it 'broadcasts to the agent_actions channel' do
        described_class.call(ticket: ticket)
        expect(ActionCable.server).to have_received(:broadcast)
          .with("agent_actions_#{workspace.id}", hash_including(event: 'pending_approval'))
      end

      it 'returns success with the agent action' do
        result = described_class.call(ticket: ticket)
        expect(result).to be_success
        expect(result.data).to be_a(AgentAction)
      end
    end

    context 'when human_in_the_loop is false' do
      let(:adapter_double) { instance_double(Ai::Providers::OpenaiAdapter) }
      let(:router_double)  { instance_double(Ai::ModelRouter) }

      before do
        allow(Ai::ModelRouter).to receive(:for).and_return(router_double)
        allow(router_double).to receive(:resolve).and_return([adapter_double, 'gpt-4o', 'openai'])
        allow(adapter_double).to receive(:chat).and_return('Password reset instructions sent.')
        allow_any_instance_of(described_class).to receive(:run_rag_response) do |_instance, steps_log|
          steps_log << { step: 'rag_response', status: 'ok', at: Time.current.iso8601 }
          'Mocked AI resolution response.'
        end
      end

      it 'executes the pipeline and resolves the ticket' do
        described_class.call(ticket: ticket)
        expect(ticket.reload).to be_status_resolved
      end

      it 'creates a completed AgentAction' do
        described_class.call(ticket: ticket)
        action = AgentAction.last
        expect(action).to be_status_completed
        expect(action.result['steps']).to be_an(Array)
      end

      it 'creates a notification for the requester' do
        expect { described_class.call(ticket: ticket) }
          .to change(Notification, :count).by(1)
        expect(Notification.last.user).to eq(user)
      end
    end
  end
  # rubocop:enable RSpec/AnyInstance
end
