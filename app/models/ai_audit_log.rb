# frozen_string_literal: true

class AiAuditLog < ApplicationRecord
  enum :operation, {
    ticket_classification:    0,
    ticket_embedding:         1,
    response_suggestion:      2,
    asset_risk_scoring:       3,
    onboarding_plan:          4,
    survey_analysis:          5,
    executive_report:         6,
    pattern_detection:        7
  }, prefix: :op

  enum :status, {
    success: 0,
    error:   1,
    timeout: 2
  }, prefix: true

  belongs_to :workspace
  belongs_to :user, optional: true

  validates :operation, presence: true
  validates :model, presence: true
  validates :prompt, presence: true
  validates :response, presence: true
  validates :prompt_tokens, numericality: { greater_than_or_equal_to: 0 }
  validates :completion_tokens, numericality: { greater_than_or_equal_to: 0 }
  validates :duration_ms, numericality: { greater_than_or_equal_to: 0 }
  validates :confidence_score,
            numericality: { greater_than_or_equal_to: 0.0, less_than_or_equal_to: 1.0 },
            allow_nil: true

  COST_PER_1K_PROMPT_TOKENS     = 0.005
  COST_PER_1K_COMPLETION_TOKENS = 0.015

  def estimated_cost_usd
    prompt_cost     = (prompt_tokens / 1000.0) * COST_PER_1K_PROMPT_TOKENS
    completion_cost = (completion_tokens / 1000.0) * COST_PER_1K_COMPLETION_TOKENS
    (prompt_cost + completion_cost).round(6)
  end
end
