# frozen_string_literal: true

class ComplianceLog < ApplicationRecord
  belongs_to :workspace
  belongs_to :actor, class_name: 'User', optional: true

  enum :event_type, {
    data_export: 0,
   data_purge: 1,
   bulk_delete: 2,
   sensitive_access: 3,
   ai_audit_view: 4,
   user_invite: 5,
   user_role_change: 6,
   retention_policy_change: 7,
   gdpr_request: 8,
   data_access_denied: 9,
   webauthn_credential_registered: 10,
   webauthn_credential_revoked: 11,
   webauthn_authentication_succeeded: 12,
   webauthn_authentication_failed: 13
  }, prefix: true

  validates :resource_type, presence: true
  validates :resource_id,   presence: true
  validates :event_type,    presence: true

  scope :for_workspace, ->(workspace) { where(workspace: workspace) }
  scope :recent,        -> { order(created_at: :desc) }
  scope :in_period,     ->(start_date, end_date) { where(created_at: start_date..end_date) }
  scope :access_denied, -> { where(event_type: event_types[:data_access_denied]) }
end
