# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::ClassifyTicketJob, type: :job do
  include ActiveJob::TestHelper

  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace:) }
  let(:user)       { create(:user, workspace:, role: :employee) }
  let(:ticket)     { create(:ticket, workspace:, department:, created_by: user) }

  def stub_successful_classification
    allow(Ai::TicketClassifier).to receive(:call).and_return(ServiceResult.success(ticket))
  end

  def stub_successful_embedding
    allow(Ai::EmbeddingGenerator).to receive(:call).and_return(
      ServiceResult.success(instance_double(TicketEmbedding))
    )
  end

  describe '#perform' do
    context 'when classification and embedding succeed' do
      before do
        stub_successful_classification
        stub_successful_embedding
      end

      it 'calls TicketClassifier with the ticket' do
        expect(Ai::TicketClassifier).to receive(:call).with(ticket:).and_return(ServiceResult.success(ticket))
        described_class.perform_now(ticket.id)
      end

      it 'calls EmbeddingGenerator after classification' do
        stub_successful_classification
        expect(Ai::EmbeddingGenerator).to receive(:call).and_return(
          ServiceResult.success(instance_double(TicketEmbedding))
        )
        described_class.perform_now(ticket.id)
      end

      it 'broadcasts to ActionCable' do
        expect(ActionCable.server).to receive(:broadcast).with(
          "workspace_#{workspace.id}_tickets",
          hash_including(type: 'ticket_classified', ticket_id: ticket.id)
        )
        described_class.perform_now(ticket.id)
      end
    end

    context 'when classification fails' do
      before do
        allow(Ai::TicketClassifier).to receive(:call)
          .and_return(ServiceResult.failure('OpenAI timeout'))
      end

      it 'raises ClassificationError so Sidekiq retries' do
        expect { described_class.perform_now(ticket.id) }
          .to raise_error(Ai::ClassificationError)
      end
    end

    context 'when embedding fails but classification succeeds' do
      before do
        stub_successful_classification
        allow(Ai::EmbeddingGenerator).to receive(:call)
          .and_return(ServiceResult.failure('embed error'))
      end

      it 'does NOT raise — classification is preserved' do
        expect { described_class.perform_now(ticket.id) }.not_to raise_error
      end

      it 'still broadcasts ActionCable' do
        expect(ActionCable.server).to receive(:broadcast)
        described_class.perform_now(ticket.id)
      end
    end

    context 'when ticket does not exist' do
      it 'raises ActiveRecord::RecordNotFound' do
        expect { described_class.perform_now(999_999) }
          .to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end

  describe 'queue configuration' do
    it 'is enqueued on the ai_processing queue' do
      expect(described_class.new.queue_name).to eq('ai_processing')
    end
  end
end
