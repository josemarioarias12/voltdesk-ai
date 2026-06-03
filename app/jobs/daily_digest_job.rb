# frozen_string_literal: true

class DailyDigestJob < ApplicationJob
  queue_as :default

  def perform
    Workspace.active.find_each do |workspace|
      workspace.users.active.find_each { |user| process_user(user) }
    end
  end

  private

  def process_user(user)
    digest = build_digest(user)
    return if digest.empty?

    notification = create_notification(user, digest)
    broadcast(user, notification)
  end

  def create_notification(user, digest)
    Notification.create!(
      workspace: user.workspace,
      user: user,
      title: "Your daily digest — #{Time.zone.today.strftime('%b %d')}",
      body: digest.join(' · '),
      notification_type: :daily_digest,
      resource_type: nil,
      resource_id: nil
    )
  end

  def broadcast(user, notification)
    ActionCable.server.broadcast(
      "notifications_#{user.id}",
      {
        id: notification.id,
        title: notification.title,
        body: notification.body,
        notification_type: notification.notification_type,
        read: false,
        created_at: notification.created_at.iso8601
      }
    )
  end

  def build_digest(user)
    items = []
    items.concat(hr_items(user))
    items.concat(ticket_items(user))
    items.concat(notification_items(user))
    items
  end

  def hr_items(user)
    return [] unless user.role_hr_manager? || user.role_workspace_admin?

    pending = LeaveRequest.where(workspace: user.workspace, status: :pending).count
    pending.positive? ? ["#{pending} leave requests pending"] : []
  end

  def ticket_items(user)
    count = Ticket.where(workspace: user.workspace, assigned_to: user, status: %i[open in_progress]).count
    count.positive? ? ["#{count} open tickets assigned to you"] : []
  end

  def notification_items(user)
    count = user.notifications.unread.where(created_at: ...1.day.ago).count
    count.positive? ? ["#{count} unread notifications"] : []
  end
end
