# frozen_string_literal: true

class DemoChannel < ApplicationCable::Channel
  def subscribed
    token = params[:token]
    return reject unless valid_token?(token)

    stream_from "demo_#{token}"
  end

  def unsubscribed
    stop_all_streams
  end

  private

  def valid_token?(token)
    token.present? && REDIS.exists?("demo_token:#{token}")
  end
end
