# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::EmbeddingGenerator, type: :service do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace:) }
  let(:ticket) do
    create(:ticket,
           workspace:,
           department:,
           title:       'Laptop screen flickering',
           description: 'MacBook Pro 14 screen flickers randomly since last week.',
           category:    'it')
  end

  describe '.call' do
    context 'when OpenAI returns a valid embedding' do
      before { stub_openai_embeddings }

      it 'returns a successful ServiceResult' do
        result = described_class.call(ticket:)
        expect(result).to be_success
      end

      it 'creates a TicketEmbedding record' do
        expect { described_class.call(ticket:) }
          .to change(TicketEmbedding, :count).by(1)
      end

      it 'stores the correct vector dimensions' do
        described_class.call(ticket:)
        embedding = TicketEmbedding.find_by(ticket:)
        expect(embedding.embedding.size).to eq(1536)
      end

      it 'stores the correct workspace' do
        described_class.call(ticket:)
        expect(TicketEmbedding.find_by(ticket:).workspace).to eq(workspace)
      end

      it 'creates an AiAuditLog with correct model' do
        described_class.call(ticket:)
        log = AiAuditLog.last
        expect(log.model).to eq('text-embedding-3-large')
        expect(log.operation).to eq('ticket_embedding')
      end

      it 'upserts — calling twice does not create duplicate records' do
        described_class.call(ticket:)
        expect { described_class.call(ticket:) }
          .not_to change(TicketEmbedding, :count)
      end
    end

    context 'when OpenAI returns empty embedding data' do
      before do
        stub_request(:post, 'https://api.openai.com/v1/embeddings')
          .to_return(
            status: 200,
            body: { 'data' => [], 'usage' => {} }.to_json,
            headers: { 'Content-Type' => 'application/json' }
          )
      end

      it 'returns a failure' do
        result = described_class.call(ticket:)
        expect(result).to be_failure
      end
    end
  end
end
