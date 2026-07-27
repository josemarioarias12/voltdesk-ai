# frozen_string_literal: true

module Ai
  module Tools
    class DepartmentTickets < Base
      def self.tool_name = 'department_tickets'

      def self.description
        'Returns ticket counts and status/priority breakdown for the tickets visible ' \
          "to the current user's department (managers and agents). " \
          'Use this when a department manager or agent asks about their team or department tickets.'
      end

      def self.visible_to?(user)
        user.role_department_manager? || user.role_agent?
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
