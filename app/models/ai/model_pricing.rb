# frozen_string_literal: true

module Ai
  class ModelPricing < ApplicationRecord
    self.table_name = 'ai_model_pricings'

    validates :provider, presence: true
    validates :model, presence: true
    validates :input_cost, :output_cost, presence: true,
                                          numericality: { greater_than_or_equal_to: 0 }

    def self.for_provider_model(provider, model)
      find_by(provider: provider, model: model)
    end

    def self.cost_per_1k(provider, model)
      pricing = for_provider_model(provider, model)
      return nil unless pricing

      ((pricing.input_cost + pricing.output_cost) / 2.0).to_f
    end
  end
end
