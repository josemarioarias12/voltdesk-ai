# frozen_string_literal: true

class TicketsChannel < ApplicationCable::Channel
  def subscribed
    if params[:ticket_id].present?
      ticket = current_workspace.tickets.find_by(id: params[:ticket_id])
      return reject unless ticket

      stream_from "ticket:#{ticket.id}"
    else
      stream_from "tickets:#{current_workspace.id}"
    end
  end

  def unsubscribed
    stop_all_streams
  end
end
