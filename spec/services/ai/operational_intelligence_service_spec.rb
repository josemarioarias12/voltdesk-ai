# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::OperationalIntelligenceService do
  let(:workspace) { create(:workspace) }
  let(:adapter) { instance_double(Ai::Providers::OpenaiAdapter) }

  let(:mock_response) do
    {
      content: '{"predictions":[{"type":"volume_spike","confidence":0.87,"message":"Incremento esperado","recommendation":"Aumentar agentes","urgency":"warning"}],"weekly_roi":{"hours_saved":12.0,"cost_saved":840},"summary":"Semana normal."}',
      tokens: 350
    }
  end

  before do
    router = instance_double(Ai::ModelRouter)
    allow(Ai::ModelRouter).to receive(:for).and_return(router)
    allow(router).to receive(:resolve).and_return([adapter, 'gpt-4o', 'openai'])
    allow(adapter).to receive(:chat).and_return(mock_response)
    allow_any_instance_of(described_class).to receive(:with_ai_audit).and_yield({})
  end

  describe '.call' do
    context 'with insufficient data' do
      it 'returns failure' do
        result = described_class.call(workspace: workspace, period: 7.days)
        expect(result).to be_failure
        expect(result.error).to eq('insufficient_data')
      end
    end

    context 'with enough tickets' do
      before do
        create_list(:ticket, 5, workspace: workspace, created_at: 2.days.ago)
      end

      it 'returns success with predictions array' do
        result = described_class.call(workspace: workspace, period: 7.days)
        expect(result).to be_success
        expect(result.data[:predictions]).to be_an(Array)
      end

      it 'returns weekly_roi in response' do
        result = described_class.call(workspace: workspace, period: 7.days)
        expect(result.data[:weekly_roi]).to include(:hours_saved, :cost_saved)
      end
    end
  end
end
