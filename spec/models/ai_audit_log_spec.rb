# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AiAuditLog do
  describe '.filtered_by' do
    let!(:classification_log) do
      create(:ai_audit_log, operation: :ticket_classification, provider: 'openai', status: :success,
                             created_at: 3.days.ago)
    end
    let!(:embedding_log) do
      create(:ai_audit_log, operation: :ticket_embedding, provider: 'openai', status: :error,
                             created_at: 1.day.ago)
    end
    let(:assistant_message) { create(:assistant_message) }
    let!(:assistant_log) do
      create(:ai_audit_log, operation: :workspace_assistant_query, provider: 'anthropic', status: :success,
                             assistant_message: assistant_message, created_at: Time.current)
    end

    it 'filters by operation when present' do
      result = described_class.filtered_by(operation: 'ticket_classification')

      expect(result).to contain_exactly(classification_log)
    end

    it 'filters by provider when present' do
      result = described_class.filtered_by(provider: 'anthropic')

      expect(result).to contain_exactly(assistant_log)
    end

    it 'filters by status when present' do
      result = described_class.filtered_by(status: 'error')

      expect(result).to contain_exactly(embedding_log)
    end

    it 'filters by assistant_message_id when present' do
      result = described_class.filtered_by(assistant_message_id: assistant_message.id)

      expect(result).to contain_exactly(assistant_log)
    end

    it 'filters by a from date, inclusive' do
      result = described_class.filtered_by(from: 2.days.ago.to_date.to_s)

      expect(result).to contain_exactly(embedding_log, assistant_log)
    end

    it 'filters by a to date, inclusive through end of day' do
      result = described_class.filtered_by(to: 2.days.ago.to_date.to_s)

      expect(result).to contain_exactly(classification_log)
    end

    it 'returns everything when no filters are given' do
      result = described_class.filtered_by({})

      expect(result).to contain_exactly(classification_log, embedding_log, assistant_log)
    end

    it 'combines multiple filters' do
      result = described_class.filtered_by(provider: 'openai', status: 'error')

      expect(result).to contain_exactly(embedding_log)
    end
  end
end
