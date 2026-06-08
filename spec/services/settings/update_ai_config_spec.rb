# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Settings::UpdateAiConfig do
  subject(:result) { described_class.call(workspace: workspace, params: params) }

  let(:workspace) { create(:workspace) }

  context 'with valid OpenAI config' do
    let(:params) { { ai_provider: 'openai', ai_model: 'gpt-4o', ai_fallback_provider: 'anthropic', ai_selection_mode: 'automatic' } }

    it { expect(result).to be_success }

    it 'updates all AI fields' do
      result
      workspace.reload
      expect(workspace.ai_provider).to eq('openai')
      expect(workspace.ai_model).to eq('gpt-4o')
      expect(workspace.ai_selection_mode).to eq('automatic')
    end
  end

  context 'with valid Anthropic config' do
    let(:params) { { ai_provider: 'anthropic', ai_model: 'claude-sonnet-4-5', ai_fallback_provider: 'openai', ai_selection_mode: 'manual' } }

    it { expect(result).to be_success }
  end

  context 'with invalid provider' do
    let(:params) { { ai_provider: 'unknown', ai_model: 'gpt-4o', ai_selection_mode: 'automatic' } }

    it 'returns failure mentioning the provider' do
      expect(result).to be_failure
      expect(result.error).to include('unknown')
    end
  end

  context 'with model not valid for provider' do
    let(:params) { { ai_provider: 'openai', ai_model: 'gemini-2.0-flash', ai_selection_mode: 'automatic' } }

    it { expect(result).to be_failure }
  end

  context 'with invalid mode' do
    let(:params) { { ai_provider: 'openai', ai_model: 'gpt-4o', ai_selection_mode: 'turbo' } }

    it { expect(result).to be_failure }
  end

  context 'without fallback provider' do
    let(:params) { { ai_provider: 'openai', ai_model: 'gpt-4o', ai_fallback_provider: '', ai_selection_mode: 'automatic' } }

    it 'defaults fallback to openai' do
      result
      expect(workspace.reload.ai_fallback_provider).to eq('openai')
    end
  end
end
