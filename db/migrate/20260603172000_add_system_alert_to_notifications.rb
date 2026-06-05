# frozen_string_literal: true

class AddSystemAlertToNotifications < ActiveRecord::Migration[8.0]
  def change
    # No-op: enum values are defined in the model, not as DB constraints.
    # system_alert: 7 added to Notification#notification_type enum in S6.
  end
end
