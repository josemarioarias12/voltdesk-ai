# frozen_string_literal: true

class TicketMailer < ApplicationMailer
  include ActionView::Helpers::DateHelper

  def confirmation(ticket)
    @ticket    = ticket
    @user      = ticket.created_by
    @workspace = ticket.workspace

    mail(
      to:      @user.email,
      subject: "[#{@ticket.ticket_number}] Ticket received — AI classification in progress"
    )
  end

  def assignment(ticket)
    @ticket    = ticket
    @agent     = ticket.assigned_to
    @workspace = ticket.workspace

    mail(
      to:      @agent.email,
      subject: "[#{@ticket.ticket_number}] New ticket assigned to you"
    )
  end

  def resolution(ticket)
    @ticket          = ticket
    @user            = ticket.created_by
    @workspace       = ticket.workspace
    @resolution_time = distance_of_time_in_words(@ticket.created_at, @ticket.resolved_at)

    mail(
      to:      @user.email,
      subject: "[#{@ticket.ticket_number}] Your ticket has been resolved"
    )
  end
end
