# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::ModelRouter do
  let(:workspace) { create(:workspace, ai_provider: 'openai', ai_model: 'gpt-4o', ai_fallback_provider: 'anthropic') }

  describe '.for' do
    it 'returns a ModelRouter instance' do
      router = described_class.for(workspace: workspace)
      expect(router).to be_a(described_class)
    end
  end

  describe '#resolve' do
    it 'returns openai adapter for openai workspace' do
      adapter, model, provider = described_class.for(workspace: workspace).resolve
      expect(adapter).to be_a(Ai::Providers::OpenaiAdapter)
      expect(model).to eq('gpt-4o')
      expect(provider).to eq('openai')
    end

    it 'returns openai adapter for embedding operations' do
      adapter, _, provider = described_class.for(workspace: workspace, operation: :embedding).resolve
      expect(adapter).to be_a(Ai::Providers::OpenaiAdapter)
      expect(provider).to eq('openai')
    end

    it 'falls back to anthropic when primary fails' do
      allow(Ai::Providers::OpenaiAdapter).to receive(:new).and_raise(StandardError, 'unavailable')
      _, _model, provider = described_class.for(workspace: workspace).resolve
      expect(provider).to eq('anthropic')
    end

    it 'uses gemini adapter for gemini workspace' do
      workspace.update!(ai_provider: 'gemini', ai_model: 'gemini-2.0-flash')
      adapter, _, provider = described_class.for(workspace: workspace).resolve
      expect(adapter).to be_a(Ai::Providers::GeminiAdapter)
      expect(provider).to eq('gemini')
    end
  end

  describe '#estimated_cost_per_1k_calls' do
    it 'returns a positive number' do
      cost = described_class.for(workspace: workspace).estimated_cost_per_1k_calls
      expect(cost).to be > 0
    end
  end

  describe '.cost_per_1k' do
    it 'returns cost for known provider/model' do
      expect(described_class.cost_per_1k('openai', 'gpt-4o')).to be > 0
    end

    it 'returns 0 for unknown provider/model' do
      expect(described_class.cost_per_1k('unknown', 'unknown')).to eq(0.0)
    end
  end

  describe '.provider_models' do
    it 'returns models for each provider' do
      expect(described_class.provider_models.keys).to include('openai', 'anthropic', 'gemini')
    end
  end
end
