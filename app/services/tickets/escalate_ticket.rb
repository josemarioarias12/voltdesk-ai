# frozen_string_literal: true

module Tickets
  class EscalateTicket
    def self.call(**args) = new(**args).call

    def initialize(ticket:)
      @ticket = ticket
    end

    def call
      return ServiceResult.failure('Ticket already critical') if @ticket.priority_critical?
      return ServiceResult.failure('Ticket already resolved or closed') if already_resolved?

      old_priority = @ticket.priority

      ActiveRecord::Base.transaction do
        @ticket.update!(priority: :critical)

        @ticket.activities.create!(
          user: nil,
          action: TicketActivity::ESCALATED,
          metadata: {
            from_priority: old_priority,
            to_priority: 'critical',
            reason: 'sla_breach',
            breached_at: Time.current.iso8601
          }
        )
      end

      broadcast_escalation
      ServiceResult.success(@ticket)
    rescue StandardError => e
      Rails.logger.error("[Tickets::EscalateTicket] #{e.class}: #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def already_resolved?
      @ticket.status_resolved? || @ticket.status_closed?
    end

    def broadcast_escalation
      ActionCable.server.broadcast(
        "tickets:#{@ticket.workspace_id}",
        { event: 'ticket_escalated', ticket_id: @ticket.id, priority: 'critical' }
      )
    end
  end
end
