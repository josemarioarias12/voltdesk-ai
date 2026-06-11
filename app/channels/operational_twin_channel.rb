# frozen_string_literal: true

class OperationalTwinChannel < ApplicationCable::Channel
  def subscribed
    workspace_id = current_user.workspace_id
    stream_from "operational_twin_#{workspace_id}"
  end

  def unsubscribed
    stop_all_streams
  end
end
