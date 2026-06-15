# frozen_string_literal: true

class Workspace < ApplicationRecord
  # ── Associations ──────────────────────────────────────────────────────────────
  has_many :users,           dependent: :destroy
  has_many :departments,     dependent: :destroy
  has_many :tickets,         dependent: :destroy
  has_many :sla_policies,    dependent: :destroy
  has_many :ai_audit_logs,   dependent: :destroy
  has_many :leave_requests,  dependent: :destroy
  has_many :onboarding_plans, dependent: :destroy
  has_many :notifications,   dependent: :destroy
  has_many :assets,          dependent: :destroy
  has_many :asset_incidents, dependent: :destroy
  has_many :pattern_alerts,  dependent: :destroy
  has_many :spaces,          dependent: :destroy
  has_many :space_reservations, dependent: :destroy
  has_many :compliance_logs,         dependent: :destroy
  has_many :data_retention_policies, dependent: :destroy
  has_many :api_keys, dependent: :destroy
  has_many :api_requests, dependent: :destroy
  has_many :webhooks, dependent: :destroy

  # ── Validations ───────────────────────────────────────────────────────────────
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :slug, presence: true, uniqueness: true,
                   format: { with: /\A[a-z0-9-]+\z/, message: :invalid_slug }
  validates :plan, presence: true, inclusion: { in: %w[starter professional enterprise] }

  # ── Callbacks ─────────────────────────────────────────────────────────────────
  before_validation :generate_slug, on: :create

  # ── Scopes ────────────────────────────────────────────────────────────────────
  scope :active, -> { where(active: true) }

  private

  def generate_slug
    return if slug.present?

    base      = name.to_s.downcase.gsub(/[^a-z0-9]+/, '-').gsub(/\A-|-\z/, '')
    candidate = base
    n         = 1

    while Workspace.exists?(slug: candidate)
      candidate = "#{base}-#{n}"
      n += 1
    end

    self.slug = candidate
  end
end
