# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::GenerateResponseSuggestionJob, type: :job do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace:) }
  let(:user)       { create(:user, workspace:, role: :employee) }
  let(:ticket)     { create(:ticket, workspace:, department:, created_by: user, ai_metadata: { 'category' => 'it' }) }

  describe '#perform' do
    context 'when ResponseSuggester finds a similar resolved ticket' do
      before do
        allow(Ai::ResponseSuggester).to receive(:call).and_return(
          ServiceResult.success(
            suggestion: 'Try restarting the printer spooler service.',
            based_on: %w[TK-00042],
            generated_at: Time.current.iso8601
          )
        )
      end

      it 'stores the suggestion under ai_metadata with found: true' do
        described_class.perform_now(ticket.id)

        suggestion = ticket.reload.ai_metadata['response_suggestion']
        expect(suggestion['found']).to be true
        expect(suggestion['suggestion']).to eq('Try restarting the printer spooler service.')
        expect(suggestion['based_on']).to eq(['TK-00042'])
      end

      it 'preserves the existing ai_metadata keys instead of overwriting them' do
        described_class.perform_now(ticket.id)

        expect(ticket.reload.ai_metadata['category']).to eq('it')
      end

      it 'broadcasts to the ticket channel' do
        expect(ActionCable.server).to receive(:broadcast).with(
          "ticket:#{ticket.id}", { event: 'response_suggestion_ready' }
        )
        described_class.perform_now(ticket.id)
      end
    end

    context 'when ResponseSuggester finds no similar resolved tickets' do
      before do
        allow(Ai::ResponseSuggester).to receive(:call).and_return(ServiceResult.success(nil))
      end

      it 'stores found: false' do
        described_class.perform_now(ticket.id)

        expect(ticket.reload.ai_metadata['response_suggestion']).to eq('found' => false)
      end
    end

    context 'when ResponseSuggester fails' do
      before do
        allow(Ai::ResponseSuggester).to receive(:call).and_return(ServiceResult.failure('embedding error'))
      end

      it 'stores found: false instead of raising' do
        expect { described_class.perform_now(ticket.id) }.not_to raise_error
        expect(ticket.reload.ai_metadata['response_suggestion']).to eq('found' => false)
      end
    end

    context 'when the ticket does not exist' do
      it 'logs the error instead of raising' do
        expect { described_class.perform_now(0) }.not_to raise_error
      end
    end

    context 'when a user_id is given' do
      let(:agent) { create(:user, workspace:, role: :agent) }

      before do
        allow(Ai::ResponseSuggester).to receive(:call).and_return(ServiceResult.success(nil))
      end

      it 'resolves the user and passes it to ResponseSuggester' do
        described_class.perform_now(ticket.id, agent.id)
        expect(Ai::ResponseSuggester).to have_received(:call).with(ticket: ticket, user: agent)
      end
    end

    context 'when no user_id is given' do
      before do
        allow(Ai::ResponseSuggester).to receive(:call).and_return(ServiceResult.success(nil))
      end

      it 'passes user: nil to ResponseSuggester' do
        described_class.perform_now(ticket.id)
        expect(Ai::ResponseSuggester).to have_received(:call).with(ticket: ticket, user: nil)
      end
    end
  end
end
