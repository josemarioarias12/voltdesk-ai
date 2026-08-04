# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::ModelPricing do
  subject(:pricing) do
    described_class.new(
      provider: 'openai',
      model: 'gpt-4o',
      input_cost: 0.0025,
      output_cost: 0.01,
      source: 'openrouter',
      verified_at: Time.current
    )
  end

  describe 'validations' do
    it 'is valid with all required attributes' do
      expect(pricing).to be_valid
    end

    it 'requires provider' do
      pricing.provider = nil
      expect(pricing).not_to be_valid
    end

    it 'requires model' do
      pricing.model = nil
      expect(pricing).not_to be_valid
    end

    it 'rejects a negative input_cost' do
      pricing.input_cost = -0.01
      expect(pricing).not_to be_valid
    end
  end

  describe '.for_provider_model' do
    it 'finds the record by provider and model' do
      pricing.save!
      expect(described_class.for_provider_model('openai', 'gpt-4o')).to eq(pricing)
    end

    it 'returns nil when no record exists' do
      expect(described_class.for_provider_model('openai', 'gpt-4o')).to be_nil
    end
  end

  describe '.cost_per_1k' do
    it 'returns the average of input and output cost' do
      pricing.save!
      expect(described_class.cost_per_1k('openai', 'gpt-4o')).to eq(0.00625)
    end

    it 'returns a Float, not a BigDecimal, so JSON serialization stays numeric' do
      pricing.save!
      expect(described_class.cost_per_1k('openai', 'gpt-4o')).to be_a(Float)
    end

    it 'returns nil when no record exists for that provider/model' do
      expect(described_class.cost_per_1k('openai', 'gpt-4o')).to be_nil
    end
  end

  describe 'uniqueness at the database level' do
    it 'raises when a duplicate provider/model pair is inserted' do
      pricing.save!
      duplicate = described_class.new(pricing.attributes.except('id'))

      expect { duplicate.save!(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
    end
  end
end
