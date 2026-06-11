# frozen_string_literal: true

class WorkflowRule < ApplicationRecord
  belongs_to :workspace
  has_many :workflow_executions, dependent: :destroy

  enum :trigger_event, {
    ticket_created:   0,
    ticket_updated:   1,
    ticket_resolved:  2,
    sla_breach:       3,
    assignment_change: 4
  }, prefix: true

  validates :name, presence: true
  validates :trigger_event, presence: true
  validates :conditions, presence: true
  validates :actions, presence: true

  scope :active_rules,     -> { where(active: true) }
  scope :for_workspace,    ->(wid) { where(workspace_id: wid) }
  scope :for_event,        ->(evt) { where(trigger_event: trigger_events[evt]) }
end
