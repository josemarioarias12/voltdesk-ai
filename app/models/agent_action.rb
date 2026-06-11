# frozen_string_literal: true

class AgentAction < ApplicationRecord
  belongs_to :workspace
  belongs_to :ticket
  belongs_to :approved_by, class_name: 'User', optional: true

  enum :action_type, {
    auto_resolve:      0,
    post_comment:      1,
    reassign_agent:    2,
    escalate_priority: 3,
    notify_user:       4
  }, prefix: true

  enum :status, {
    pending_approval: 0,
    approved:         1,
    rejected:         2,
    executing:        3,
    completed:        4,
    failed:           5
  }, prefix: true

  validates :confidence, presence: true,
                         numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 1 }
  validates :action_type, presence: true
  validates :status, presence: true

  scope :pending,    -> { where(status: statuses[:pending_approval]) }
  scope :for_workspace, ->(wid) { where(workspace_id: wid) }
end
