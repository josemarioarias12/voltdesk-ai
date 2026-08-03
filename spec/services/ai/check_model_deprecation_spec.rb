# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::CheckModelDeprecation do
  subject(:result) { described_class.call }

  def stub_adapter(klass, model_ids)
    allow(klass).to receive(:new).and_return(instance_double(klass, list_model_ids: model_ids))
  end

  before do
    stub_adapter(Ai::Providers::OpenaiAdapter, %w[gpt-4o gpt-4o-mini gpt-4.1 gpt-4.1-mini gpt-5.2])
    stub_adapter(Ai::Providers::AnthropicAdapter, %w[claude-sonnet-5 claude-haiku-4-5-20251001])
    stub_adapter(Ai::Providers::GeminiAdapter, %w[gemini-2.0-flash gemini-1.5-pro])
  end

  context 'when all configured models are live for every provider' do
    it 'succeeds without flagging anything' do
      expect(result).to be_success
      expect(result.data[:flagged]).to eq(0)
    end

    it 'creates no suggestions' do
      result
      expect(Ai::ModelGovernanceSuggestion.count).to eq(0)
    end
  end

  context 'when a configured model is missing from the provider live list' do
    before { stub_adapter(Ai::Providers::OpenaiAdapter, %w[gpt-4o-mini gpt-4.1 gpt-4.1-mini gpt-5.2]) }

    it 'flags exactly one model' do
      expect(result.data[:flagged]).to eq(1)
    end

    it 'creates a pending model_deprecation suggestion for that model' do
      result

      suggestion = Ai::ModelGovernanceSuggestion.find_by(provider: 'openai', model: 'gpt-4o')
      expect(suggestion).to be_present
      expect(suggestion.status_pending_approval?).to be true
      expect(suggestion.suggestion_type_model_deprecation?).to be true
    end

    it 'includes a verify_url pointing to the provider docs' do
      result

      suggestion = Ai::ModelGovernanceSuggestion.find_by(provider: 'openai', model: 'gpt-4o')
      expect(suggestion.result['verify_url']).to eq('https://platform.openai.com/docs/models')
    end
  end

  context 'when a provider is unreachable' do
    before do
      allow(Ai::Providers::AnthropicAdapter).to receive(:new).and_raise(StandardError, 'timeout')
    end

    it 'does not flag that provider models as deprecated' do
      expect(result).to be_success
      expect(Ai::ModelGovernanceSuggestion.where(provider: 'anthropic')).to be_empty
    end

    it 'still checks the other providers normally' do
      result
      expect(Ai::ModelGovernanceSuggestion.count).to eq(0)
    end
  end

  context 'when a pending suggestion already exists for the same model' do
    before do
      stub_adapter(Ai::Providers::OpenaiAdapter, %w[gpt-4o-mini gpt-4.1 gpt-4.1-mini gpt-5.2])
      create(:ai_model_governance_suggestion, provider: 'openai', model: 'gpt-4o', suggestion_type: :model_deprecation)
    end

    it 'updates the existing suggestion instead of creating a new one' do
      expect { result }.not_to change(Ai::ModelGovernanceSuggestion, :count)
    end
  end
end
