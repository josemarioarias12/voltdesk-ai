# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::ResponseSuggester do
  subject(:result) { described_class.call(ticket: ticket, user: user) }

  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :agent) }
  let(:ticket)    { create(:ticket, workspace: workspace, title: 'Printer not working') }

  describe '.call' do
    context 'when no similar resolved tickets exist' do
      before do
        stub_openai_embeddings
        allow(TicketEmbedding).to receive(:similar_resolved)
          .and_return(TicketEmbedding.none)
      end

      it 'returns success with nil' do
        expect(result).to be_success
        expect(result.data).to be_nil
      end
    end

    context 'when similar resolved tickets exist' do
      let(:resolved_ticket) { create(:ticket, workspace: workspace, status: :resolved) }
      let!(:emb) do
        create(:ticket_embedding, ticket: resolved_ticket, workspace: workspace,
                                  embedding: Array.new(1536, 0.1))
      end

      before do
        stub_openai_embeddings
        stub_openai_rag
        create(:ticket_embedding, ticket: ticket, workspace: workspace,
                                  embedding: Array.new(1536, 0.1))
        allow(TicketEmbedding).to receive(:similar_resolved)
          .and_return(TicketEmbedding.where(id: emb.id))
      end

      it 'returns success with a suggestion' do
        expect(result).to be_success
        expect(result.data[:suggestion]).to be_present
      end

      it 'includes citation ticket numbers' do
        expect(result.data[:based_on]).to include(resolved_ticket.ticket_number)
      end
    end

    context 'when embedding generation fails' do
      before do
        allow(Ai::EmbeddingGenerator).to receive(:call)
          .and_return(ServiceResult.failure('Embedding failed'))
      end

      it 'returns failure' do
        expect(result).to be_failure
      end
    end

    context 'when OpenAI raises an error' do
      let(:resolved_ticket) { create(:ticket, workspace: workspace, status: :resolved) }
      let!(:emb) do
        create(:ticket_embedding, ticket: resolved_ticket, workspace: workspace,
                                  embedding: Array.new(1536, 0.1))
      end

      before do
        stub_openai_embeddings
        create(:ticket_embedding, ticket: ticket, workspace: workspace,
                                  embedding: Array.new(1536, 0.1))
        allow(TicketEmbedding).to receive(:similar_resolved)
          .and_return(TicketEmbedding.where(id: emb.id))
        stub_request(:post, 'https://api.openai.com/v1/chat/completions')
          .to_raise(StandardError.new('OpenAI down'))
      end

      it 'returns failure gracefully' do
        expect(result).to be_failure
      end
    end
  end
end
