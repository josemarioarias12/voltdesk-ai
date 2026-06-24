# frozen_string_literal: true

module Tickets
  class SendConfirmationEmailJob < ApplicationJob
    queue_as :default
    sidekiq_options retry: 3

    def perform(ticket_id)
      ticket = Ticket.includes(:created_by, :department, :workspace).find_by(id: ticket_id)
      return unless ticket
      return if ticket.created_by&.email.blank?

      html = TicketMailer.confirmation(ticket).html_part.body.to_s
      text = TicketMailer.confirmation(ticket).text_part.body.to_s

      Resend::Emails.send({
                            from:    'PulseDesk AI <onboarding@resend.dev>',
        to:      ENV.fetch('DEMO_EMAIL', ticket.created_by.email),
        subject: "[#{ticket.ticket_number}] Ticket received — AI classification in progress",
        html:    html,
        text:    text
                          })
    end
  end
end
