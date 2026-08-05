# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::CheckModelPricing do
  subject(:result) { described_class.call }

  let(:openrouter_url) { Ai::CheckModelPricing::OPENROUTER_MODELS_URL }

  before { stub_request(:head, %r{\Ahttps://openrouter\.ai/}).to_return(status: 200) }

  def stub_openrouter(body)
    stub_request(:get, openrouter_url).to_return(
      status: 200,
      headers: { 'Content-Type' => 'application/json' },
      body: body.to_json
    )
  end

  context 'when a mapped model price changed beyond the threshold' do
    before do
      stub_openrouter(
        data: [
          { 'id' => 'openai/gpt-4o', 'pricing' => { 'prompt' => '0.000002', 'completion' => '0.000002' } }
        ]
      )
    end

    it 'succeeds and flags one model' do
      expect(result).to be_success
      expect(result.data[:flagged]).to eq(1)
    end

    it 'includes a verify_url pointing to the OpenRouter model page' do
      result

      suggestion = Ai::ModelGovernanceSuggestion.find_by(provider: 'openai', model: 'gpt-4o')
      expect(suggestion.result['verify_url']).to eq('https://openrouter.ai/openai/gpt-4o')
    end

    it 'creates a pending pricing_update suggestion' do
      result

      suggestion = Ai::ModelGovernanceSuggestion.find_by(provider: 'openai', model: 'gpt-4o')
      expect(suggestion).to be_present
      expect(suggestion.status_pending_approval?).to be true
      expect(suggestion.result['fetched_input']).to eq(0.002)
    end

    it 'returns the real suggestion id, not a boolean' do
      suggestion_id = result.data[:suggestion_ids].first
      expect(suggestion_id).to be_a(Integer)
      expect(Ai::ModelGovernanceSuggestion.find(suggestion_id).provider).to eq('openai')
    end
  end

  context 'when the mapped model price did not change' do
    before do
      stub_openrouter(
        data: [
          { 'id' => 'openai/gpt-4o', 'pricing' => { 'prompt' => '0.0000075', 'completion' => '0.0000075' } }
        ]
      )
    end

    it 'does not create any suggestion' do
      result
      expect(Ai::ModelGovernanceSuggestion.count).to eq(0)
    end
  end

  context 'when a pending suggestion already exists for the same model' do
    before do
      stub_openrouter(
        data: [
          { 'id' => 'openai/gpt-4o', 'pricing' => { 'prompt' => '0.000002', 'completion' => '0.000002' } }
        ]
      )
      create(:ai_model_governance_suggestion, provider: 'openai', model: 'gpt-4o', suggestion_type: :pricing_update)
    end

    it 'updates the existing suggestion instead of creating a new one' do
      expect { result }.not_to change(Ai::ModelGovernanceSuggestion, :count)
    end
  end

  context 'when a decided suggestion already exists with the same fetched price' do
    before do
      stub_openrouter(
        data: [
          { 'id' => 'openai/gpt-4o', 'pricing' => { 'prompt' => '0.000002', 'completion' => '0.000002' } }
        ]
      )
      create(
        :ai_model_governance_suggestion,
        provider: 'openai', model: 'gpt-4o', suggestion_type: :pricing_update, status: :approved,
        result: { 'fetched_input' => 0.002, 'fetched_output' => 0.002 }
      )
    end

    it 'does not create a new suggestion' do
      expect { result }.not_to change(Ai::ModelGovernanceSuggestion, :count)
    end

    it 'does not flag the model' do
      expect(result.data[:flagged]).to eq(0)
    end
  end

  context 'when a decided suggestion exists but the fetched price changed again' do
    before do
      stub_openrouter(
        data: [
          { 'id' => 'openai/gpt-4o', 'pricing' => { 'prompt' => '0.000002', 'completion' => '0.000002' } }
        ]
      )
      create(
        :ai_model_governance_suggestion,
        provider: 'openai', model: 'gpt-4o', suggestion_type: :pricing_update, status: :approved,
        result: { 'fetched_input' => 0.001, 'fetched_output' => 0.001 }
      )
    end

    it 'creates a new pending suggestion for the new price' do
      expect { result }.to change(Ai::ModelGovernanceSuggestion, :count).by(1)
    end
  end

  context 'when OpenRouter is unreachable' do
    before { stub_request(:get, openrouter_url).to_timeout }

    it 'returns a failure result' do
      expect(result).to be_failure
    end
  end

  context 'when OpenRouter returns an unmapped model only' do
    before do
      stub_openrouter(
        data: [
          { 'id' => 'anthropic/claude-3.5-sonnet', 'pricing' => { 'prompt' => '0.000003', 'completion' => '0.000015' } }
        ]
      )
    end

    it 'succeeds without flagging anything' do
      expect(result).to be_success
      expect(result.data[:flagged]).to eq(0)
    end
  end

  context 'when the OpenRouter model page itself is unreachable' do
    before do
      stub_openrouter(
        data: [
          { 'id' => 'openai/gpt-4o', 'pricing' => { 'prompt' => '0.000002', 'completion' => '0.000002' } }
        ]
      )
      stub_request(:head, 'https://openrouter.ai/openai/gpt-4o').to_return(status: 404)
    end

    it 'falls back to the OpenRouter base models URL' do
      result

      suggestion = Ai::ModelGovernanceSuggestion.find_by(provider: 'openai', model: 'gpt-4o')
      expect(suggestion.result['verify_url']).to eq(Ai::CheckModelPricing::OPENROUTER_BASE_URL)
    end
  end
end
