# frozen_string_literal: true

class AiAuditLog < ApplicationRecord
  enum :operation, {
    ticket_classification: 0,
    ticket_embedding: 1,
    response_suggestion: 2,
    asset_risk_scoring: 3,
    onboarding_plan: 4,
    survey_analysis: 5,
    executive_report: 6,
    pattern_detection: 7,
    space_optimization: 8,
    sla_prediction: 9,
    anomaly_detection: 10,
    workspace_assistant_query: 11
  }, prefix: :op

  enum :status, {
    success: 0,
    error: 1,
    timeout: 2
  }, prefix: true

  belongs_to :workspace
  belongs_to :user, optional: true
  belongs_to :assistant_message, optional: true

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

  scope :filtered_by, lambda { |filters|
    scope = all
    scope = scope.where(operation: filters[:operation]) if filters[:operation].present?
    scope = scope.where(provider: filters[:provider]) if filters[:provider].present?
    scope = scope.where(status: filters[:status]) if filters[:status].present?
    scope = scope.where(created_at: filters[:from].to_date..) if filters[:from].present?
    scope = scope.where(created_at: ..filters[:to].to_date.end_of_day) if filters[:to].present?
    scope = scope.where(assistant_message_id: filters[:assistant_message_id]) if filters[:assistant_message_id].present?
    scope
  }

  COST_PER_1K_PROMPT_TOKENS     = 0.005
  COST_PER_1K_COMPLETION_TOKENS = 0.015

  def estimated_cost_usd
    prompt_cost     = (prompt_tokens / 1000.0) * COST_PER_1K_PROMPT_TOKENS
    completion_cost = (completion_tokens / 1000.0) * COST_PER_1K_COMPLETION_TOKENS
    (prompt_cost + completion_cost).round(6)
  end
end
