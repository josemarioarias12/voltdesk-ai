# frozen_string_literal: true

module Ai
  class SlaNotifier
    def self.call(ticket:, probability:, reasoning:)
      new(ticket: ticket, probability: probability, reasoning: reasoning).call
    end

    def initialize(ticket:, probability:, reasoning:)
      @ticket      = ticket
      @probability = probability
      @reasoning   = reasoning
      @workspace   = ticket.workspace
    end

    def call
      manager = find_manager
      return ServiceResult.failure('No manager found for department') unless manager

      return ServiceResult.failure('Notification already sent recently') if notification_sent_recently?

      notification = create_notification(manager)
      broadcast_to_manager(manager, notification)

      ServiceResult.success(notification_id: notification.id, manager_id: manager.id)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def find_manager
      @workspace.users
                .role_department_manager
                .where(department_id: @ticket.department_id)
                .first ||
        @workspace.users.role_workspace_admin.first
    end

    def notification_sent_recently?
      Notification.where(
        workspace:         @workspace,
        notification_type: :sla_breach_predicted,
        resource:          @ticket
      ).exists?(created_at: 2.hours.ago..)
    end

    def create_notification(manager)
      pct = (@probability * 100).round(1)

      Notification.create!(
        workspace:         @workspace,
        user:              manager,
        notification_type: :sla_breach_predicted,
        title:             "SLA Breach Risk: #{@ticket.ticket_number} (#{pct}%)",
        body:              "Ticket #{@ticket.ticket_number} has a #{pct}% probability of " \
                           "breaching SLA. #{@reasoning} " \
                           'Consider reassigning to reduce risk.',
        resource:          @ticket
      )
    end

    def broadcast_to_manager(manager, notification)
      ActionCable.server.broadcast(
        "notifications_#{manager.id}",
        {
          type:                 'sla_breach_predicted',
          notification_id:      notification.id,
          ticket_id:            @ticket.id,
          ticket_number:        @ticket.ticket_number,
          probability:          @probability,
          reasoning:            @reasoning,
          action_url:           "/tickets/#{@ticket.id}"
        }
      )
    end
  end
end
