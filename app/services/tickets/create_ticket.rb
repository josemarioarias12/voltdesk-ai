# frozen_string_literal: true

module Tickets
  class CreateTicket
    def self.call(**args) = new(**args).call

    def initialize(workspace:, user:, params:)
      @workspace = workspace
      @user      = user
      @params    = params
    end

    def call
      ticket = nil

      ActiveRecord::Base.transaction do
        ticket = @workspace.tickets.build(ticket_attributes)
        return ServiceResult.failure(ticket.errors.full_messages.join(', ')) unless ticket.save

        assign_agent(ticket)
        record_activity(ticket)
      end

      Ai::ClassifyTicketJob.perform_later(ticket.id)

      ServiceResult.success(ticket)
    rescue ActiveRecord::RecordInvalid => e
      ServiceResult.failure(e.message)
    rescue StandardError => e
      Rails.logger.error("[Tickets::CreateTicket] #{e.class}: #{e.message}")
      ServiceResult.failure('An unexpected error occurred. Please try again.')
    end

    private

    def ticket_attributes
      @params.merge(
        created_by: @user,
        ticket_number: generate_ticket_number,
        workspace: @workspace
      )
    end

    def generate_ticket_number
      seq_name = "workspace_#{@workspace.id}_ticket_seq"
      ensure_sequence_exists(seq_name)
      seq_value = Ticket.connection.select_value(
        Ticket.sanitize_sql(['SELECT nextval(?)', seq_name])
      )
      "TK-#{seq_value.to_s.rjust(5, '0')}"
    end

    def ensure_sequence_exists(seq_name)
      Ticket.connection.execute(
        "CREATE SEQUENCE IF NOT EXISTS #{seq_name} START 1"
      )
    end

    def assign_agent(ticket)
      result = Tickets::AssignTicket.call(ticket:)
      return unless result.failure?

      Rails.logger.warn("[Tickets::CreateTicket] Auto-assign failed: #{result.error}")
    end

    def record_activity(ticket)
      ticket.activities.create!(
        user: @user,
        action: TicketActivity::CREATED,
        metadata: { title: ticket.title, priority: ticket.priority, source: ticket.source }
      )
    end
  end
end
