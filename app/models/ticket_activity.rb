# frozen_string_literal: true

class TicketActivity < ApplicationRecord
  # ── Associations ──────────────────────────────────────────────────────────────
  belongs_to :ticket
  belongs_to :user, optional: true

  # ── Validations ───────────────────────────────────────────────────────────────
  validates :action, presence: true, length: { maximum: 100 }

  # ── Scopes ────────────────────────────────────────────────────────────────────
  scope :chronological,         -> { order(created_at: :asc) }
  scope :reverse_chronological, -> { order(created_at: :desc) }

  # ── Action constants ──────────────────────────────────────────────────────────
  CREATED        = 'created'
  STATUS_CHANGED = 'status_changed'
  ASSIGNED       = 'assigned'
  ESCALATED      = 'escalated'
  COMMENT_ADDED  = 'comment_added'
  SLA_WARNING    = 'sla_warning'
  SLA_BREACHED   = 'sla_breached'
  AI_CLASSIFIED  = 'ai_classified'

  # ── Delegation ────────────────────────────────────────────────────────────────
  delegate :workspace, to: :ticket
end
