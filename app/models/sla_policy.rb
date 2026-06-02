# frozen_string_literal: true

class SlaPolicy < ApplicationRecord
  include WorkspaceScoped

  # ── Associations ──────────────────────────────────────────────────────────────
  has_many :tickets, dependent: :nullify

  # ── Enums ─────────────────────────────────────────────────────────────────────
  enum :priority, { low: 0, medium: 1, high: 2, critical: 3 }, prefix: :priority

  # ── Validations ───────────────────────────────────────────────────────────────
  validates :name,                 presence: true, length: { maximum: 100 }
  validates :priority,             presence: true
  validates :first_response_hours, presence: true, numericality: { greater_than: 0 }
  validates :resolution_hours,     presence: true, numericality: { greater_than: 0 }
  validate  :resolution_exceeds_first_response

  # ── Scopes ────────────────────────────────────────────────────────────────────
  scope :ordered, -> { order(:priority) }

  # ── Instance methods ──────────────────────────────────────────────────────────
  def due_at_for(created_at)
    created_at + resolution_hours.hours
  end

  private

  def resolution_exceeds_first_response
    return unless first_response_hours && resolution_hours
    if resolution_hours < first_response_hours
      errors.add(:resolution_hours, "must be greater than or equal to first response hours")
    end
  end
end
