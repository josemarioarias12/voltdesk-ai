# frozen_string_literal: true

class Asset < ApplicationRecord
  include WorkspaceScoped

  enum :asset_type, {
    laptop: 0,
    desktop: 1,
    server: 2,
    monitor: 3,
    phone: 4,
    software: 5,
    other: 6
  }, prefix: true

  enum :status, {
    active: 0,
    in_maintenance: 1,
    retired: 2,
    lost: 3
  }, prefix: true

  # ── Associations ──────────────────────────────────────────────────────────────
  belongs_to :workspace
  belongs_to :assigned_to, class_name: 'User', optional: true
  belongs_to :department,  optional: true
  has_many   :asset_incidents, dependent: :destroy

  # ── Validations ───────────────────────────────────────────────────────────────
  validates :name,         presence: true
  validates :asset_number, presence: true, uniqueness: { scope: :workspace_id }
  validates :asset_type,   presence: true
  validates :status,       presence: true
  validates :risk_score,   numericality: { in: 0..100 }

  # ── Scopes ────────────────────────────────────────────────────────────────────
  scope :high_risk,           -> { where('risk_score > ?', 70) }
  scope :warranty_expiring,   ->(days) { where(warranty_expires_at: ..days.days.from_now) }
  scope :ordered_by_risk,     -> { order(risk_score: :desc) }

  # ── Instance helpers ──────────────────────────────────────────────────────────
  def warranty_expiring_soon?(days = 30)
    warranty_expires_at.present? && warranty_expires_at <= days.days.from_now
  end

  def days_since_last_maintenance
    return nil unless last_maintenance_at

    (Date.current - last_maintenance_at).to_i
  end

  def days_until_warranty_expires
    return nil unless warranty_expires_at

    (warranty_expires_at - Date.current).to_i
  end
end
