# frozen_string_literal: true

class Ticket < ApplicationRecord
  include WorkspaceScoped

  # ── Associations ──────────────────────────────────────────────────────────────
  belongs_to :workspace
  belongs_to :department
  belongs_to :created_by,  class_name: "User"
  belongs_to :assigned_to, class_name: "User", optional: true
  belongs_to :sla_policy,  optional: true

  has_many :comments,   class_name: "TicketComment",  dependent: :destroy
  has_many :activities, class_name: "TicketActivity", dependent: :destroy

  # ── Enums ─────────────────────────────────────────────────────────────────────
  enum :status, {
    open:                   0,
    in_progress:            1,
    pending:                2,
    resolved:               3,
    closed:                 4,
    pending_classification: 5
  }, prefix: :status

  enum :priority, {
    low:      0,
    medium:   1,
    high:     2,
    critical: 3
  }, prefix: :priority

  enum :category, {
    general:    0,
    it:         1,
    hr:         2,
    facilities: 3,
    finance:    4,
    operations: 5,
    support:    6
  }, prefix: :category

  enum :source, {
    web:     0,
    voice:   1,
    qr_demo: 2,
    email:   3
  }, prefix: :source

  # ── Validations ───────────────────────────────────────────────────────────────
  validates :title,         presence: true, length: { minimum: 3, maximum: 255 }
  validates :ticket_number, presence: true, uniqueness: { scope: :workspace_id }
  validates :urgency_score, numericality: { in: 0..100 }
  validates :status,        presence: true
  validates :priority,      presence: true
  validates :category,      presence: true
  validates :source,        presence: true

  # ── Callbacks ─────────────────────────────────────────────────────────────────
  before_create :set_due_at
  before_save   :set_resolved_at, if: -> { status_changed? && status_resolved? }

  # ── Scopes ────────────────────────────────────────────────────────────────────
  scope :open_tickets,      -> { where(status: %i[open in_progress pending]) }
  scope :sla_at_risk,       -> { open_tickets.where("due_at <= ?", 30.minutes.from_now) }
  scope :sla_breached,      -> { open_tickets.where("due_at < ?", Time.current) }
  scope :for_department,    ->(dept_id) { where(department_id: dept_id) }
  scope :assigned_to_agent, ->(user_id) { where(assigned_to_id: user_id) }
  scope :recent,            -> { order(created_at: :desc) }

  # ── State machine ─────────────────────────────────────────────────────────────
  VALID_TRANSITIONS = {
    "open"                   => %w[in_progress closed],
    "in_progress"            => %w[pending resolved],
    "pending"                => %w[in_progress resolved],
    "resolved"               => %w[closed open],
    "closed"                 => %w[open],
    "pending_classification" => %w[open in_progress]
  }.freeze

  def can_transition_to?(new_status)
    VALID_TRANSITIONS.fetch(status, []).include?(new_status.to_s)
  end

  # ── SLA helpers ───────────────────────────────────────────────────────────────
  def sla_breached?
    due_at.present? && due_at < Time.current && !status_resolved? && !status_closed?
  end

  def sla_at_risk?(within: 30.minutes)
    due_at.present? && due_at <= Time.current + within &&
      !sla_breached? && !status_resolved? && !status_closed?
  end

  def sla_remaining
    return nil unless due_at
    (due_at - Time.current).seconds
  end

  def sla_status
    return :met      if status_resolved? || status_closed?
    return :breached if sla_breached?
    return :at_risk  if sla_at_risk?
    :on_track
  end

  private

  def set_due_at
    return if due_at.present?
    policy = sla_policy || workspace.sla_policies.find_by(priority: priority)
    self.due_at = policy&.due_at_for(created_at || Time.current)
  end

  def set_resolved_at
    self.resolved_at = Time.current
  end
end
