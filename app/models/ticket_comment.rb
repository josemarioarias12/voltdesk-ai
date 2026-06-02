# frozen_string_literal: true

class TicketComment < ApplicationRecord
  # ── Associations ──────────────────────────────────────────────────────────────
  belongs_to :ticket
  belongs_to :user

  # ── Validations ───────────────────────────────────────────────────────────────
  validates :body, presence: true, length: { minimum: 1, maximum: 10_000 }

  # ── Scopes ────────────────────────────────────────────────────────────────────
  scope :public_comments,   -> { where(internal: false) }
  scope :internal_comments, -> { where(internal: true) }
  scope :chronological,     -> { order(created_at: :asc) }

  # ── Delegation ────────────────────────────────────────────────────────────────
  delegate :workspace, to: :ticket
end
