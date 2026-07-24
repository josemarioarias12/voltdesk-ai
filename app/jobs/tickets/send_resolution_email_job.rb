# frozen_string_literal: true

module Tickets
  class SendResolutionEmailJob < ApplicationJob
    queue_as :default
    sidekiq_options retry: 3

    def perform(ticket_id)
      ticket = Ticket.includes(:created_by, :workspace).find_by(id: ticket_id)
      return unless ticket
      return if ticket.created_by&.email.blank?
      return if ticket.resolved_at.blank?

      mail = TicketMailer.resolution(ticket)

      Resend::Emails.send(
        from:    ApplicationMailer::FROM_ADDRESS,
        to:      ticket.created_by.email,
        subject: mail.subject,
        html:    mail.html_part.body.to_s,
        text:    mail.text_part.body.to_s
      )
    rescue StandardError => e
      Rails.logger.error(
        "[Tickets::SendResolutionEmailJob] ticket_id=#{ticket_id} #{e.class}: #{e.message}"
      )
      raise
    end
  end
end
