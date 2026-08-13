# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::OperationalIntelligenceBriefJob do
  let(:workspace) { create(:workspace) }
  let(:adapter)   { instance_double(Ai::Providers::OpenaiAdapter) }

  let(:mock_response) do
    {
      content: '{"predictions":[{"type":"volume_spike","confidence":0.87,"message":"Spike expected",' \
               '"recommendation":"Add agents","urgency":"warning"}],"summary":"Normal week."}',
      tokens: 350
    }
  end

  before do
    router = instance_double(Ai::ModelRouter)
    allow(Ai::ModelRouter).to receive(:for).and_return(router)
    allow(router).to receive(:resolve).and_return([adapter, 'gpt-4o', 'openai'])
    allow(adapter).to receive(:chat).and_return(mock_response)
    allow_any_instance_of(Ai::OperationalIntelligenceService).to receive(:with_ai_audit).and_yield({})
  end

  describe '#perform' do
    context 'with enough recent tickets' do
      before { create_list(:ticket, 5, workspace: workspace, created_at: 2.days.ago) }

      it 'sends the prediction via TelegramNotifier' do
        expect(TelegramNotifier).to receive(:send_prediction).with(
          message: a_string_including('Spike expected'), level: :info
        )
        described_class.new.perform(workspace.id)
      end
    end

    context 'without enough recent tickets' do
      it 'does not send anything to Telegram' do
        expect(TelegramNotifier).not_to receive(:send_prediction)
        described_class.new.perform(workspace.id)
      end

      it 'does not raise' do
        expect { described_class.new.perform(workspace.id) }.not_to raise_error
      end
    end
  end
end
