# frozen_string_literal: true

class WorkflowExecution < ApplicationRecord
  belongs_to :workflow_rule
  belongs_to :ticket

  enum :status, {
    success: 0,
    partial: 1,
    failed:  2
  }, prefix: true

  validates :status, presence: true

  scope :recent, -> { order(executed_at: :desc) }
end
