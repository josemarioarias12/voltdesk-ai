# frozen_string_literal: true

module Tickets
  class AssignTicket
    MANAGER_ROLES = %w[department_manager it_manager hr_manager facilities_manager operations_manager].freeze
    AGENT_ROLES   = %w[agent].freeze

    def self.call(**args) = new(**args).call

    def initialize(ticket:, user: nil)
      @ticket = ticket
      @user   = user
    end

    def call
      agent = find_least_loaded_agent
      return ServiceResult.failure('No agents available in this department') if agent.nil?

      old_assignee_id = @ticket.assigned_to_id

      ActiveRecord::Base.transaction do
        @ticket.update!(assigned_to: agent)

        @ticket.activities.create!(
          user: @user,
          action: TicketActivity::ASSIGNED,
          metadata: {
            from_user_id: old_assignee_id,
            to_user_id: agent.id,
            to_user_name: agent.full_name,
            auto: @user.nil?
          }
        )
      end

      broadcast_update
      ServiceResult.success(@ticket)
    rescue ActiveRecord::RecordInvalid => e
      ServiceResult.failure(e.message)
    rescue StandardError => e
      Rails.logger.error("[Tickets::AssignTicket] #{e.class}: #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def find_least_loaded_agent
      find_least_loaded_by_roles(MANAGER_ROLES) || find_least_loaded_by_roles(AGENT_ROLES)
    end

    def find_least_loaded_by_roles(roles)
      User
        .where(workspace_id: @ticket.workspace_id,
               department_id: @ticket.department_id,
               role: roles,
               active: true)
        .left_joins(:assigned_tickets)
        .where(
          'tickets.status IN (?) OR tickets.id IS NULL',
          [Ticket.statuses[:open], Ticket.statuses[:in_progress], Ticket.statuses[:pending]]
        )
        .group('users.id')
        .order(Arel.sql('COUNT(tickets.id) ASC'))
        .limit(1)
        .first
    end

    def broadcast_update
      ActionCable.server.broadcast(
        "tickets:#{@ticket.workspace_id}",
        { event: 'ticket_assigned', ticket_id: @ticket.id, assignee_id: @ticket.assigned_to_id }
      )
    end
  end
end
