# frozen_string_literal: true

class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    reject and return unless current_user

    stream_from "notifications_#{current_user.id}"
  end

  def unsubscribed
    stop_all_streams
  end

  def mark_read(data)
    notification_id = data['notification_id']

    if notification_id == 'all'
      current_user.notifications.unread.update_all(read: true) # rubocop:disable Rails/SkipsModelValidations
    else
      notification = current_user.notifications.find_by(id: notification_id)
      notification&.mark_read!
    end
  end
end
