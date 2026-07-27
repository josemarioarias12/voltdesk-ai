# frozen_string_literal: true

module Ai
  module Tools
    class MyTickets < Base
      def self.tool_name = 'my_tickets'

      def self.description
        'Returns the count and status breakdown of tickets created by the current user. ' \
          'Use this when the user asks about "my tickets" regardless of their role.'
      end

      # Every role except guest may ask about their own tickets — guests have
      # no assistant access at all (no ticket visibility beyond creation).
      def self.visible_to?(user)
        !user.role_guest?
      end

      def call(**_params)
        tickets = Ticket.where(workspace: @workspace, created_by: @user)

        ServiceResult.success(
          total: tickets.count,
          by_status: tickets.group(:status).count,
          open_count: tickets.open_tickets.count
        )
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end
    end
  end
end
