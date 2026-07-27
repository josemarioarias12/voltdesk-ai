# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::ModelRouter do
  describe '#resolve — assistant operation override' do
    let(:workspace) do
      create(:workspace, ai_provider: 'openai', ai_model: 'gpt-4o',
                          ai_assistant_provider: 'anthropic', ai_assistant_model: 'claude-sonnet-5')
    end

    before { allow(Ai::Providers::AnthropicAdapter).to receive(:new).and_return(instance_double(Ai::Providers::AnthropicAdapter)) }

    it 'uses the assistant override for workspace_assistant_query' do
      _adapter, model, provider = described_class.for(workspace: workspace, operation: :workspace_assistant_query).resolve
      expect([provider, model]).to eq(%w[anthropic claude-sonnet-5])
    end

    it 'ignores the override for other operations' do
      allow(Ai::Providers::OpenaiAdapter).to receive(:new).and_return(instance_double(Ai::Providers::OpenaiAdapter))
      _adapter, model, provider = described_class.for(workspace: workspace, operation: :classification).resolve
      expect([provider, model]).to eq(%w[openai gpt-4o])
    end

    context 'when only one override column is set' do
      let(:workspace) do
        create(:workspace, ai_provider: 'openai', ai_model: 'gpt-4o',
                            ai_assistant_provider: 'anthropic', ai_assistant_model: nil)
      end

      it 'falls back to the general model' do
        allow(Ai::Providers::OpenaiAdapter).to receive(:new).and_return(instance_double(Ai::Providers::OpenaiAdapter))
        _adapter, model, provider = described_class.for(workspace: workspace, operation: :workspace_assistant_query).resolve
        expect([provider, model]).to eq(%w[openai gpt-4o])
      end
    end
  end

  describe '#resolve — fallback bug fix' do
    let(:workspace) { create(:workspace, ai_provider: 'openai', ai_fallback_provider: 'openai') }

    before do
      allow(Ai::Providers::OpenaiAdapter).to receive(:new).and_raise(StandardError, 'connection refused')
      allow(Ai::Providers::AnthropicAdapter).to receive(:new).and_return(instance_double(Ai::Providers::AnthropicAdapter))
    end

    it 'does not retry the same provider that just failed' do
      _adapter, _model, provider = described_class.for(workspace: workspace, operation: :classification).resolve
      expect(provider).to eq('anthropic')
    end
  end
end
