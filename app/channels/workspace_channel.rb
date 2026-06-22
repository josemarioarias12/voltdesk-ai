# frozen_string_literal: true

class WorkspaceChannel < ApplicationCable::Channel
  def subscribed
    return reject unless manager_or_above?

    stream_from "workspace_#{current_workspace.id}_managers"
  end

  def unsubscribed
    stop_all_streams
  end

  private

  def manager_or_above?
    excluded = %w[employee guest]
    excluded.none? { |role| current_user.public_send(:"role_#{role}?") }
  end
end
