# frozen_string_literal: true

class NotificationsController < ApplicationController
  def index
    authorize :notification, :index?

    notifications = current_user.notifications
                                .recent
                                .limit(50)

    render inertia: 'Notifications/Index', props: {
      notifications: serialize_notifications(notifications),
      unread_count: current_user.notifications.unread.count
    }
  end

  def mark_read
    authorize :notification, :update?

    if params[:id] == 'all'
      current_user.notifications.unread.update_all(read: true) # rubocop:disable Rails/SkipsModelValidations
    else
      notification = current_user.notifications.find(params.expect(:id))
      notification.mark_read!
    end

    redirect_back_or_to(notifications_path)
  end

  private

  def serialize_notifications(notifications)
    notifications.map do |n|
      {
        id: n.id,
        title: n.title,
        body: n.body,
        notification_type: n.notification_type,
        resource_type: n.resource_type,
        resource_id: n.resource_id,
        read: n.read,
        created_at: n.created_at.iso8601
      }
    end
  end
end
