# frozen_string_literal: true

module Ai
  module Tools
    class TicketsOverview < Base
      def self.tool_name = 'tickets_overview'

      def self.description
        'Returns ticket counts and status/priority breakdown for the tickets the current ' \
          'user has access to — the exact same scope as their own Tickets page. ' \
          'For an employee this means tickets they personally created; for an agent it means ' \
          'tickets assigned to them or in their department; for a department manager it means ' \
          'their whole department; for admin/manager-tier roles it means the entire workspace. ' \
          'Use this for any phrasing like "my tickets", "tickets I have", or "how many do I ' \
          'have" — the scope always matches what that specific user can see, not a fixed rule.'
      end

      # Every role except guest has some scope of ticket visibility — guests
      # have no ticket access beyond creating one via the QR flow.
      def self.visible_to?(user)
        !user.role_guest?
      end

      def call(**_params)
        tickets = TicketPolicy::Scope.new(@user, Ticket.where(workspace: @workspace)).resolve

        ServiceResult.success(
          total: tickets.count,
          by_status: tickets.group(:status).count,
          by_priority: tickets.group(:priority).count,
          open_count: tickets.open_tickets.count
        )
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end
    end
  end
end
