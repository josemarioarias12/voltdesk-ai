# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::AgentOrchestrator do
  let(:workspace) do
    create(:workspace, settings: {
             'agent_threshold'   => 80,
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

  # Stub build_rag_data to avoid real AI calls in all contexts.
  # This isolates the orchestrator logic from AI provider networking.
  let(:rag_data_stub) do
    {
      similar_tickets: [{ id: 1, title: 'Similar ticket', similarity: 0.92 }],
      top_similarity:  0.92,
      ai_reasoning:    'Mocked AI resolution response.'
    }
  end

  before do
    create(:ticket_embedding, ticket: ticket)
    create(:user, workspace: workspace, role: :agent) # bot_user fallback
    allow(ActionCable.server).to receive(:broadcast)
    allow_any_instance_of(described_class).to receive(:build_rag_data).and_return(rag_data_stub)
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
                            'agent_threshold'   => 80,
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

      it 'stores XAI data in result JSONB' do
        described_class.call(ticket: ticket)
        action = AgentAction.last
        expect(action.result['similar_tickets']).to be_an(Array)
        expect(action.result['ai_reasoning']).to eq('Mocked AI resolution response.')
      end

      it 'sets confidence from RAG top_similarity, not urgency_score' do
        described_class.call(ticket: ticket)
        expect(AgentAction.last.confidence.to_f).to eq(0.92)
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
      it 'executes the pipeline and resolves the ticket' do
        described_class.call(ticket: ticket)
        expect(ticket.reload).to be_status_resolved
      end

      it 'creates a completed AgentAction with XAI data in result' do
        described_class.call(ticket: ticket)
        action = AgentAction.last
        expect(action).to be_status_completed
        expect(action.result['steps']).to be_an(Array)
        expect(action.result['similar_tickets']).to be_an(Array)
        expect(action.result['ai_reasoning']).to eq('Mocked AI resolution response.')
      end

      it 'sets confidence from RAG top_similarity' do
        described_class.call(ticket: ticket)
        expect(AgentAction.last.confidence.to_f).to eq(0.92)
      end

      it 'posts a comment with the AI reasoning text (not raw hash)' do
        described_class.call(ticket: ticket)
        comment = ticket.comments.last
        expect(comment).not_to be_nil
        expect(comment.body).to eq('Mocked AI resolution response.')
        expect(comment.body).not_to include('content:')
      end

      it 'creates a notification for the requester' do
        expect { described_class.call(ticket: ticket) }
          .to change(Notification, :count).by(1)
        expect(Notification.last.user).to eq(user)
      end
    end
  end
end
# rubocop:enable RSpec/AnyInstance
