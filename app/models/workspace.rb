# frozen_string_literal: true

class Workspace < ApplicationRecord
  # ── Associations ──────────────────────────────────────────────────────────────
  has_many :users,          dependent: :destroy
  has_many :departments,    dependent: :destroy
  has_many :tickets,        dependent: :destroy
  has_many :sla_policies,   dependent: :destroy
  has_many :ai_audit_logs,  dependent: :destroy

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
    base = name.to_s.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-\z/, "")
    candidate = base
    n = 1
    while Workspace.exists?(slug: candidate)
      candidate = "#{base}-#{n}"
      n += 1
    end
    self.slug = candidate
  end
end
