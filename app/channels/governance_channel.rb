# frozen_string_literal: true

class GovernanceChannel < ApplicationCable::Channel
  def subscribed
    return reject unless current_user
    return reject unless Pundit.policy(current_user, Ai::ModelGovernanceSuggestion).sync_now?

    stream_from 'governance_sync'
  end

  def unsubscribed
    stop_all_streams
  end
end
