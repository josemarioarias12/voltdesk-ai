# frozen_string_literal: true

class PatternAlert < ApplicationRecord
  include WorkspaceScoped

  belongs_to :workspace

  enum :alert_type, {
    ticket_cluster: 0,
    sla_spike: 1,
    department_surge: 2
  }, prefix: true

  enum :severity, {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3
  }, prefix: true

  validates :title,      presence: true
  validates :alert_type, presence: true
  validates :severity,   presence: true

  scope :active,   -> { where(resolved_at: nil) }
  scope :resolved, -> { where.not(resolved_at: nil) }
  scope :recent,   -> { where(created_at: 2.hours.ago..) }

  def resolve!
    update!(resolved_at: Time.current)
  end

  def resolved?
    resolved_at.present?
  end
end
