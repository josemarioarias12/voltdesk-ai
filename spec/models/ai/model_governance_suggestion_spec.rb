# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::ModelGovernanceSuggestion do
  subject(:suggestion) do
    described_class.new(
      provider: 'openai',
      model: 'gpt-4o',
      suggestion_type: :pricing_update
    )
  end

  describe 'validations' do
    it 'is valid with provider and model' do
      expect(suggestion).to be_valid
    end

    it 'requires provider' do
      suggestion.provider = nil
      expect(suggestion).not_to be_valid
    end

    it 'requires model' do
      suggestion.model = nil
      expect(suggestion).not_to be_valid
    end
  end

  describe 'defaults' do
    it 'defaults to pending_approval status' do
      suggestion.save!
      expect(suggestion.status_pending_approval?).to be true
    end

    it 'defaults result to an empty hash' do
      suggestion.save!
      expect(suggestion.result).to eq({})
    end
  end

  describe '#approve!' do
    let(:reviewer) { create(:user) }

    context 'when suggestion_type is model_deprecation' do
      it 'sets status to approved (a human must still pick a replacement model)' do
        suggestion.save!
        suggestion.update!(suggestion_type: :model_deprecation)
        suggestion.approve!(user: reviewer)

        expect(suggestion.status_approved?).to be true
        expect(suggestion.reviewed_by).to eq(reviewer)
        expect(suggestion.reviewed_at).to be_present
      end
    end

    context 'when suggestion_type is pricing_update with real fetched data' do
      before do
        suggestion.result = { 'fetched_input' => 0.002, 'fetched_output' => 0.01, 'source' => 'openrouter' }
        suggestion.save!
      end

      it 'jumps straight to applied, with no separate approved state' do
        suggestion.approve!(user: reviewer)

        expect(suggestion.status_applied?).to be true
        expect(suggestion.applied_at).to be_present
        expect(suggestion.reviewed_by).to eq(reviewer)
      end

      it 'writes the fetched price into Ai::ModelPricing' do
        suggestion.approve!(user: reviewer)

        pricing = Ai::ModelPricing.for_provider_model('openai', 'gpt-4o')
        expect(pricing.input_cost).to eq(0.002)
        expect(pricing.output_cost).to eq(0.01)
      end

      it 'invalidates the pricing cache for that provider/model' do
        Rails.cache.write('ai_model_pricing/openai/gpt-4o', 999)
        suggestion.approve!(user: reviewer)

        expect(Rails.cache.read('ai_model_pricing/openai/gpt-4o')).to be_nil
      end
    end

    context 'when suggestion_type is pricing_update without fetched data in result' do
      it 'raises instead of silently applying a blank price' do
        suggestion.save!
        expect { suggestion.approve!(user: reviewer) }.to raise_error(ArgumentError, /Missing fetched pricing data/)
      end
    end
  end

  describe '#reject!' do
    let(:reviewer) { create(:user) }

    it 'sets status, reviewed_by, and reviewed_at' do
      suggestion.save!
      suggestion.reject!(user: reviewer)

      expect(suggestion.status_rejected?).to be true
      expect(suggestion.reviewed_by).to eq(reviewer)
      expect(suggestion.reviewed_at).to be_present
    end
  end

  describe '#mark_applied!' do
    it 'sets status and applied_at' do
      suggestion.save!
      suggestion.mark_applied!

      expect(suggestion.status_applied?).to be true
      expect(suggestion.applied_at).to be_present
    end
  end

  describe '.for_provider_model' do
    it 'filters by provider and model' do
      suggestion.save!
      other = described_class.create!(provider: 'anthropic', model: 'claude-sonnet-5', suggestion_type: :model_deprecation)

      expect(described_class.for_provider_model('openai', 'gpt-4o')).to contain_exactly(suggestion)
      expect(described_class.for_provider_model('openai', 'gpt-4o')).not_to include(other)
    end
  end

  describe '.filtered_by' do
    let!(:pricing_pending) { suggestion.tap(&:save!) }
    let!(:deprecation_rejected) do
      described_class.create!(
        provider: 'anthropic', model: 'claude-sonnet-5',
        suggestion_type: :model_deprecation, status: :rejected
      )
    end

    it 'filters by suggestion_type when present' do
      result = described_class.filtered_by(suggestion_type: 'pricing_update')

      expect(result).to contain_exactly(pricing_pending)
    end

    it 'filters by status when present' do
      result = described_class.filtered_by(status: 'rejected')

      expect(result).to contain_exactly(deprecation_rejected)
    end

    it 'returns everything when no filters are given' do
      result = described_class.filtered_by({})

      expect(result).to contain_exactly(pricing_pending, deprecation_rejected)
    end

    it 'combines both filters when both are present' do
      result = described_class.filtered_by(suggestion_type: 'model_deprecation', status: 'rejected')

      expect(result).to contain_exactly(deprecation_rejected)
    end

    it 'returns nothing when the combination matches no record' do
      result = described_class.filtered_by(suggestion_type: 'pricing_update', status: 'rejected')

      expect(result).to be_empty
    end
  end
end
