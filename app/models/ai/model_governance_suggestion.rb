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

    def approve!(user:)
      update!(status: :approved, reviewed_by: user, reviewed_at: Time.current)
    end

    def reject!(user:)
      update!(status: :rejected, reviewed_by: user, reviewed_at: Time.current)
    end

    def mark_applied!
      update!(status: :applied, applied_at: Time.current)
    end
  end
end
