# frozen_string_literal: true

module Hr
  class NotifyLeaveRequest
    def self.call(**args) = new(**args).call

    def initialize(leave_request:, event:)
      @leave_request = leave_request
      @event         = event
    end

    def call
      case @event
      when :submitted then notify_hr_managers
      when :approved  then notify_employee(:leave_request_approved)
      when :rejected  then notify_employee(:leave_request_rejected)
      end
    rescue StandardError => e
      Rails.logger.error("Hr::NotifyLeaveRequest failed: #{e.message}")
    end

    private

    def notify_hr_managers
      hr_managers.each do |manager|
        notification = Notification.create!(
          workspace: @leave_request.workspace,
          user: manager,
          title: "New leave request from #{@leave_request.user.full_name}",
          body: "#{@leave_request.leave_type.humanize} — #{@leave_request.business_days} business days",
          notification_type: :leave_request_submitted,
          resource_type: 'LeaveRequest',
          resource_id: @leave_request.id
        )

        broadcast(notification, manager)
      end
    end

    def notify_employee(type)
      notification = Notification.create!(
        workspace: @leave_request.workspace,
        user: @leave_request.user,
        title: notification_title(type),
        body: notification_body(type),
        notification_type: type,
        resource_type: 'LeaveRequest',
        resource_id: @leave_request.id
      )

      broadcast(notification, @leave_request.user)
    end

    def broadcast(notification, user)
      ActionCable.server.broadcast(
        "notifications_#{user.id}",
        {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          notification_type: notification.notification_type,
          resource_type: notification.resource_type,
          resource_id: notification.resource_id,
          read: false,
          created_at: notification.created_at.iso8601
        }
      )
    end

    def hr_managers
      User.where(
        workspace: @leave_request.workspace,
        role: :hr_manager
      )
    end

    def notification_title(type)
      case type
      when :leave_request_approved then 'Leave request approved'
      when :leave_request_rejected then 'Leave request rejected'
      end
    end

    def notification_body(type)
      dates = formatted_dates
      leave = @leave_request.leave_type.humanize.downcase
      case type
      when :leave_request_approved
        "Your #{leave} request (#{dates}) has been approved."
      when :leave_request_rejected
        "Your #{leave} request (#{dates}) was rejected: #{@leave_request.rejection_reason}"
      end
    end

    def formatted_dates
      start = @leave_request.start_date.strftime('%b %d')
      finish = @leave_request.end_date.strftime('%b %d, %Y')
      "#{start} – #{finish}"
    end
  end
end
