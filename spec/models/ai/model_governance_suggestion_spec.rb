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

    it 'sets status, reviewed_by, and reviewed_at' do
      suggestion.save!
      suggestion.approve!(user: reviewer)

      expect(suggestion.status_approved?).to be true
      expect(suggestion.reviewed_by).to eq(reviewer)
      expect(suggestion.reviewed_at).to be_present
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
end
