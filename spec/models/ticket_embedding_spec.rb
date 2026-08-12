# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TicketEmbedding do
  describe '.similar_resolved' do
    let(:workspace) { create(:workspace) }
    let(:query_vector) { Array.new(1536, 0.1) }

    context 'when the workspace has no resolved tickets' do
      before do
        open_ticket = create(:ticket, workspace: workspace, status: :open)
        create(:ticket_embedding, ticket: open_ticket, workspace: workspace, embedding: query_vector)
      end

      it 'returns none without raising' do
        result = described_class.similar_resolved(query_vector: query_vector, workspace: workspace)
        expect(result).to be_empty
      end
    end

    context 'when a resolved ticket has a similar embedding' do
      let(:resolved_ticket) { create(:ticket, workspace: workspace, status: :resolved) }
      let!(:matching_embedding) do
        create(:ticket_embedding, ticket: resolved_ticket, workspace: workspace, embedding: query_vector)
      end

      it 'returns the matching embedding' do
        result = described_class.similar_resolved(query_vector: query_vector, workspace: workspace)
        expect(result).to include(matching_embedding)
      end
    end

    context 'when a resolved ticket has a dissimilar embedding' do
      let(:resolved_ticket) { create(:ticket, workspace: workspace, status: :resolved) }
      let(:dissimilar_vector) { Array.new(1536) { |i| i.even? ? 1.0 : -1.0 } }

      before do
        create(:ticket_embedding, ticket: resolved_ticket, workspace: workspace, embedding: dissimilar_vector)
      end

      it 'excludes it when it falls outside distance_threshold' do
        result = described_class.similar_resolved(query_vector: query_vector, workspace: workspace,
                                                  distance_threshold: 0.01)
        expect(result).to be_empty
      end
    end

    context 'when a similar embedding belongs to an open ticket in the same workspace' do
      let(:open_ticket) { create(:ticket, workspace: workspace, status: :open) }

      before do
        create(:ticket_embedding, ticket: open_ticket, workspace: workspace, embedding: query_vector)
      end

      it 'excludes it, even though the embedding itself is a close match' do
        result = described_class.similar_resolved(query_vector: query_vector, workspace: workspace)
        expect(result).to be_empty
      end
    end

    context 'when a resolved ticket belongs to a different workspace' do
      let(:other_workspace) { create(:workspace) }
      let(:other_resolved_ticket) { create(:ticket, workspace: other_workspace, status: :resolved) }

      before do
        create(:ticket_embedding, ticket: other_resolved_ticket, workspace: other_workspace,
                                   embedding: query_vector)
      end

      it 'excludes it from another workspace results' do
        result = described_class.similar_resolved(query_vector: query_vector, workspace: workspace)
        expect(result).to be_empty
      end
    end
  end
end
