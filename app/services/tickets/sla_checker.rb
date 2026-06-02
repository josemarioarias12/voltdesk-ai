# frozen_string_literal: true

module Tickets
  class SlaChecker
    WARNING_WINDOW = 30.minutes

    def self.call(**args) = new(**args).call

    def initialize(ticket:)
      @ticket = ticket
    end

    def call
      return ServiceResult.success(:skip_no_due_at) if @ticket.due_at.nil?
      return ServiceResult.success(:skip_resolved)  if already_resolved?

      if @ticket.sla_breached?
        handle_breach
      elsif @ticket.sla_at_risk?(within: WARNING_WINDOW)
        handle_warning
      else
        ServiceResult.success(:on_track)
      end
    rescue StandardError => e
      Rails.logger.error("[Tickets::SlaChecker] #{e.class}: #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def already_resolved?
      @ticket.status_resolved? || @ticket.status_closed?
    end

    def handle_breach
      return ServiceResult.success(:already_critical) if @ticket.priority_critical?
      return ServiceResult.success(:already_breached_activity) if breach_activity_exists?

      @ticket.activities.create!(
        user:     nil,
        action:   TicketActivity::SLA_BREACHED,
        metadata: { breached_at: Time.current.iso8601, due_at: @ticket.due_at.iso8601 }
      )

      EscalateTicket.call(ticket: @ticket)
    end

    def handle_warning
      return ServiceResult.success(:warning_already_sent) if warning_activity_exists?

      @ticket.activities.create!(
        user:     nil,
        action:   TicketActivity::SLA_WARNING,
        metadata: {
          due_at:    @ticket.due_at.iso8601,
          remaining: @ticket.sla_remaining.to_i
        }
      )

      broadcast_warning
      ServiceResult.success(:warning_sent)
    end

    def broadcast_warning
      ActionCable.server.broadcast(
        "tickets:#{@ticket.workspace_id}",
        { event: "sla_warning", ticket_id: @ticket.id, due_at: @ticket.due_at }
      )
    end

    def breach_activity_exists?
      @ticket.activities.exists?(action: TicketActivity::SLA_BREACHED)
    end

    def warning_activity_exists?
      @ticket.activities.exists?(action: TicketActivity::SLA_WARNING)
    end
  end
end
