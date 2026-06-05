# frozen_string_literal: true

class AssetIncident < ApplicationRecord
  include WorkspaceScoped

  enum :severity, {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3
  }, prefix: true

  enum :status, {
    open: 0,
    resolved: 1
  }, prefix: true

  # ── Associations ──────────────────────────────────────────────────────────────
  belongs_to :asset
  belongs_to :workspace
  belongs_to :reported_by, class_name: 'User', optional: true

  # ── Validations ───────────────────────────────────────────────────────────────
  validates :title,    presence: true
  validates :severity, presence: true
  validates :status,   presence: true

  # ── Scopes ────────────────────────────────────────────────────────────────────
  scope :recent,        -> { where('created_at > ?', 90.days.ago) }
  scope :last_90_days,  -> { where(created_at: 90.days.ago..) }
end
