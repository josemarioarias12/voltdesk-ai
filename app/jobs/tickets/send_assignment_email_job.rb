# frozen_string_literal: true

module Tickets
  class SendAssignmentEmailJob < ApplicationJob
    queue_as :default
    sidekiq_options retry: 3

    def perform(ticket_id)
      ticket = Ticket.includes(:assigned_to, :department, :workspace).find_by(id: ticket_id)
      return unless ticket
      return if ticket.assigned_to&.email.blank?

      mail = TicketMailer.assignment(ticket)

      Resend::Emails.send(
        from:    ApplicationMailer::FROM_ADDRESS,
        to:      ticket.assigned_to.email,
        subject: mail.subject,
        html:    mail.html_part.body.to_s,
        text:    mail.text_part.body.to_s
      )
    rescue StandardError => e
      Rails.logger.error(
        "[Tickets::SendAssignmentEmailJob] ticket_id=#{ticket_id} #{e.class}: #{e.message}"
      )
      raise
    end
  end
end
