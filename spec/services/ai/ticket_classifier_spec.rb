# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::TicketClassifier, type: :service do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace:, name: 'IT') }
  let(:user)       { create(:user, workspace:, role: :employee) }
  let(:ticket) do
    create(:ticket,
           workspace:,
           department:,
           created_by: user,
           title: 'Printer not working in Accounting — month close in 2 hours',
           description: 'HP LaserJet 4015 is completely stuck. Entire team blocked.')
  end

  describe '.call' do
    context 'when OpenAI returns a valid classification' do
      before { stub_openai_classify }

      it 'returns a successful ServiceResult' do
        result = described_class.call(ticket:)
        expect(result).to be_success
      end

      it 'updates the ticket category to the mapped enum value' do
        described_class.call(ticket:)
        # hardware_printer maps to 'it' in the Ticket enum
        expect(ticket.reload.category).to eq('it')
      end

      it 'updates the ticket priority' do
        described_class.call(ticket:)
        expect(ticket.reload.priority).to eq('critical')
      end

      it 'updates the urgency_score' do
        described_class.call(ticket:)
        expect(ticket.reload.urgency_score).to eq(87)
      end

      it 'persists ai_metadata with granular category and reasoning' do
        described_class.call(ticket:)
        metadata = ticket.reload.ai_metadata
        # ai_metadata stores the granular AI category, not the enum value
        expect(metadata['category']).to eq('it')
        expect(metadata['reasoning']['category_signals']).to include('printer')
        expect(metadata['reasoning']['confidence']).to eq(0.94)
        expect(metadata['reasoning']['similar_ticket']).to eq('TK-00189')
      end

      it 'creates an AiAuditLog entry' do
        expect { described_class.call(ticket:) }
          .to change(AiAuditLog, :count).by(1)
      end

      it 'logs the correct operation and status' do
        described_class.call(ticket:)
        log = AiAuditLog.last
        expect(log.operation).to eq('ticket_classification')
        expect(log.status).to eq('success')
        expect(log.confidence_score).to eq(0.94)
      end

      it 'logs token counts' do
        described_class.call(ticket:)
        log = AiAuditLog.last
        expect(log.prompt_tokens).to eq(280)
        expect(log.completion_tokens).to eq(120)
        expect(log.total_tokens).to eq(400)
      end

      it 'records an ai_classified activity with the from/to values' do
        described_class.call(ticket:)
        activity = ticket.reload.activities.find_by(action: TicketActivity::AI_CLASSIFIED)

        expect(activity).not_to be_nil
        expect(activity.user).to be_nil
        expect(activity.metadata['category']).to eq('from' => 'general', 'to' => 'it')
        expect(activity.metadata['priority']).to eq('from' => 'medium', 'to' => 'critical')
      end
    end

    context 'when classification does not change category or priority' do
      let(:ticket) do
        create(:ticket,
               workspace:,
               department:,
               created_by: user,
               category: :it,
               priority: :critical,
               title: 'Printer not working in Accounting — month close in 2 hours',
               description: 'HP LaserJet 4015 is completely stuck. Entire team blocked.')
      end

      before { stub_openai_classify }

      it 'does not record an ai_classified activity' do
        described_class.call(ticket:)
        activity = ticket.reload.activities.find_by(action: TicketActivity::AI_CLASSIFIED)

        expect(activity).to be_nil
      end
    end

    context 'when OpenAI returns an invalid priority value' do
      before do
        invalid_priority_response = AiStubs::CLASSIFY_RESPONSE.deep_dup
        content = JSON.parse(invalid_priority_response[:choices][0][:message][:content])
        content['priority'] = 'urgent'
        invalid_priority_response[:choices][0][:message][:content] = content.to_json
        stub_openai_classify(invalid_priority_response)
      end

      it 'defaults to medium instead of raising an enum error' do
        result = described_class.call(ticket:)
        expect(result).to be_success
        expect(ticket.reload.priority).to eq('medium')
      end
    end

    context 'when OpenAI returns invalid JSON' do
      before do
        stub_request(:post, 'https://api.openai.com/v1/chat/completions')
          .to_return(
            status: 200,
            body: { 'choices' => [{ 'message' => { 'content' => 'not json at all' } }] }.to_json,
            headers: { 'Content-Type' => 'application/json' }
          )
      end

      it 'returns a failure ServiceResult' do
        result = described_class.call(ticket:)
        expect(result).to be_failure
      end

      it 'sets the ticket status to pending_classification' do
        described_class.call(ticket:)
        expect(ticket.reload.status).to eq('pending_classification')
      end

      it 'still creates an AiAuditLog with error status' do
        described_class.call(ticket:)
        log = AiAuditLog.last
        expect(log).not_to be_nil
        expect(log.status).to eq('error')
      end
    end

    context 'when AiAuditLog creation fails (fail open)' do
      before do
        stub_openai_classify
        allow(AiAuditLog).to receive(:create!).and_raise(ActiveRecord::RecordInvalid)
      end

      it 'still returns a successful result' do
        result = described_class.call(ticket:)
        expect(result).to be_success
      end

      it 'still updates the ticket' do
        described_class.call(ticket:)
        expect(ticket.reload.category).to eq('it')
      end
    end

    context 'WebMock enforcement' do
      it 'blocks real HTTP calls to OpenAI' do
        expect do
          Net::HTTP.get(URI('https://api.openai.com/v1/models'))
        end.to raise_error(WebMock::NetConnectNotAllowedError)
      end
    end
  end
end
