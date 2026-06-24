# frozen_string_literal: true

module Tickets
  class SendConfirmationEmailJob < ApplicationJob
    queue_as :default
    sidekiq_options retry: 3

    def perform(ticket_id)
      ticket = Ticket.includes(:created_by, :department, :workspace).find_by(id: ticket_id)
      return unless ticket
      return if ticket.created_by&.email.blank?

      TicketMailer.confirmation(ticket).deliver_now
    end
  end
end
