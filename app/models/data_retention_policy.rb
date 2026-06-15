# frozen_string_literal: true

class DataRetentionPolicy < ApplicationRecord
  belongs_to :workspace

  RESOURCE_TYPES = %w[tickets ai_audit_logs notifications].freeze

  DEFAULTS = {
    'tickets'       => 1825,
    'ai_audit_logs' => 365,
    'notifications' => 90
  }.freeze

  validates :resource_type, presence: true, inclusion: { in: RESOURCE_TYPES }
  validates :retention_days, presence: true, numericality: { greater_than: 0 }
  validates :resource_type, uniqueness: { scope: :workspace_id }

  scope :for_workspace, ->(workspace) { where(workspace: workspace) }
  scope :auto_purge_enabled, -> { where(auto_purge: true) }

  def self.seed_defaults_for(workspace)
    DEFAULTS.each do |resource_type, days|
      find_or_create_by!(workspace: workspace, resource_type: resource_type) do |policy|
        policy.retention_days = days
        policy.auto_purge     = false
      end
    end
  end

  def purge_before_date
    retention_days.days.ago
  end
end
