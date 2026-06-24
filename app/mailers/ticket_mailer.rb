# frozen_string_literal: true

class TicketMailer < ApplicationMailer
  def confirmation(ticket)
    @ticket    = ticket
    @user      = ticket.created_by
    @workspace = ticket.workspace

    mail(
      to:      @user.email,
      subject: "[#{@ticket.ticket_number}] Ticket received — AI classification in progress"
    )
  end
end
