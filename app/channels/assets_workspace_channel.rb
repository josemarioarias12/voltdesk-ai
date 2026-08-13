# frozen_string_literal: true

class AssetsWorkspaceChannel < ApplicationCable::Channel
  def subscribed
    return reject unless current_user
    return reject unless Pundit.policy(current_user, :asset).index?

    stream_from "assets_workspace_#{current_user.workspace_id}"
  end

  def unsubscribed
    stop_all_streams
  end
end
