# frozen_string_literal: true

module Ai
  class ModelGovernanceSuggestion < ApplicationRecord
    self.table_name = 'ai_model_governance_suggestions'

    belongs_to :reviewed_by, class_name: 'User', optional: true

    enum :suggestion_type, {
      pricing_update:    0,
      model_deprecation: 1
    }, prefix: true

    enum :status, {
      pending_approval: 0,
      approved:         1,
      rejected:         2,
      applied:          3
    }, prefix: true

    validates :provider, presence: true
    validates :model, presence: true

    scope :for_provider_model, ->(provider, model) { where(provider: provider, model: model) }
    scope :recent, -> { order(created_at: :desc) }
    scope :filtered_by, lambda { |filters|
      scope = all
      scope = scope.where(suggestion_type: filters[:suggestion_type]) if filters[:suggestion_type].present?
      scope = scope.where(status: filters[:status]) if filters[:status].present?
      scope
    }

    def approve!(user:)
      if suggestion_type_pricing_update?
        apply_pricing!
        update!(status: :applied, reviewed_by: user, reviewed_at: Time.current, applied_at: Time.current)
      else
        update!(status: :approved, reviewed_by: user, reviewed_at: Time.current)
      end
    end

    def reject!(user:)
      update!(status: :rejected, reviewed_by: user, reviewed_at: Time.current)
    end

    def mark_applied!
      update!(status: :applied, applied_at: Time.current)
    end

    private

    def apply_pricing!
      input  = result['fetched_input']
      output = result['fetched_output']
      raise ArgumentError, 'Missing fetched pricing data in result' if input.nil? || output.nil?

      pricing = Ai::ModelPricing.find_or_initialize_by(provider: provider, model: model)
      pricing.input_cost  = input
      pricing.output_cost = output
      pricing.source      = result['source']
      pricing.verified_at = Time.current
      pricing.save!

      Rails.cache.delete("ai_model_pricing/#{provider}/#{model}")
    end
  end
end
