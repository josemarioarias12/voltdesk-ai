# frozen_string_literal: true

class Notification < ApplicationRecord
  include WorkspaceScoped

  belongs_to :workspace
  belongs_to :user

  enum :notification_type, {
    leave_request_submitted: 0,
    leave_request_approved: 1,
    leave_request_rejected: 2,
    ticket_assigned: 3,
    ticket_sla_warning: 4,
    onboarding_plan_ready: 5,
    daily_digest: 6
  }

  scope :unread,  -> { where(read: false) }
  scope :recent,  -> { order(created_at: :desc) }

  def mark_read!
    update!(read: true)
  end
end
