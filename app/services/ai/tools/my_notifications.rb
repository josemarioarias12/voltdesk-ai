# frozen_string_literal: true

module Ai
  module Tools
    class MyNotifications < Base
      def self.tool_name = 'my_notifications'

      def self.description
        'Returns the count of unread notifications for the current user, broken down by ' \
          'notification type. Notifications are always personal — every role, including ' \
          'guest, only ever sees their own, there is no department or workspace-wide view.'
      end

      def self.visible_to?(_user) = true

      def call(**_params)
        notifications = NotificationPolicy::Scope.new(@user, Notification.all).resolve

        ServiceResult.success(
          unread_count: notifications.unread.count,
          unread_by_type: notifications.unread.group(:notification_type).count
        )
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end
    end
  end
end
