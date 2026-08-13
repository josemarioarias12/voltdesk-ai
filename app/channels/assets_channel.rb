# frozen_string_literal: true

class AssetsChannel < ApplicationCable::Channel
  def subscribed
    return reject unless current_user

    asset = current_user.workspace.assets.find_by(id: params[:asset_id])
    return reject unless asset
    return reject unless Pundit.policy(current_user, asset).show?

    stream_from "asset_#{asset.id}"
  end

  def unsubscribed
    stop_all_streams
  end
end
