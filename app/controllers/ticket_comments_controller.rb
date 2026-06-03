# frozen_string_literal: true

class TicketCommentsController < ApplicationController
  before_action :set_ticket

  def create
    comment = @ticket.comments.build(comment_params.merge(user: current_user))
    authorize comment

    if comment.internal? && !policy(comment).create_internal?
      return redirect_back_or_to(ticket_path(@ticket), alert: "You don't have permission to post internal notes.")
    end

    if comment.save
      @ticket.activities.create!(
        user: current_user,
        action: TicketActivity::COMMENT_ADDED,
        metadata: { comment_id: comment.id, internal: comment.internal? }
      )

      ActionCable.server.broadcast(
        "ticket:#{@ticket.id}",
        { event: 'comment_added', comment_id: comment.id }
      )

      redirect_to ticket_path(@ticket)
    else
      redirect_back_or_to(ticket_path(@ticket), alert: comment.errors.full_messages.join(', '))
    end
  end

  private

  def set_ticket
    @ticket = policy_scope(Ticket).find(params.expect(:ticket_id))
  end

  def comment_params
    params.expect(ticket_comment: %i[body internal])
  end
end
