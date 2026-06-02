# frozen_string_literal: true

class Department < ApplicationRecord
  include WorkspaceScoped

  has_many :users, dependent: :nullify

  COLORS = %w[#6366f1 #8b5cf6 #ec4899 #ef4444 #f97316 #eab308 #22c55e #14b8a6 #0ea5e9].freeze
  ICONS  = %w[briefcase laptop users building wrench dollar-sign chart-bar].freeze

  validates :name,  presence: true, uniqueness: { scope: :workspace_id }
  scope :ordered, -> { order(:name) }
  validates :color, presence: true, inclusion: { in: COLORS }
  validates :icon,  presence: true, inclusion: { in: ICONS }
end
