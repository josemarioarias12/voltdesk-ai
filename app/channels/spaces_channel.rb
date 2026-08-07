# frozen_string_literal: true

class SpacesChannel < ApplicationCable::Channel
  def subscribed
    workspace = current_user.workspace
    stream_from "spaces:#{workspace.id}"
  end

  def unsubscribed
    stop_all_streams
  end

  def self.broadcast_space_update(workspace, space)
    utilization = compute_utilization(workspace, space)

    ActionCable.server.broadcast(
      "spaces:#{workspace.id}",
      {
        type: 'space_updated',
        space: {
          id: space.id,
          name: space.name,
          floor: space.floor,
          capacity: space.capacity,
          status: space.status,
          space_type: space.space_type,
          utilization_today: utilization
        }
      }
    )
  end

  def self.broadcast_avatar_position(workspace, reservation)
    ActionCable.server.broadcast(
      "spaces:#{workspace.id}",
      {
        type: 'avatar_positioned',
        reservation: {
          space_id: reservation.space_id,
          user_id: reservation.user_id,
          user_name: reservation.user.full_name,
          user_avatar_url: avatar_url_for(reservation.user),
          start_at: reservation.start_at,
          end_at: reservation.end_at
        }
      }
    )
  end

  def self.broadcast_avatar_removed(workspace, reservation)
    ActionCable.server.broadcast(
      "spaces:#{workspace.id}",
      {
        type: 'avatar_removed',
        space_id: reservation.space_id,
        user_id: reservation.user_id
      }
    )
  end

  def self.avatar_url_for(user)
    return nil unless user.avatar.attached?

    Rails.application.routes.url_helpers.url_for(user.avatar)
  end

  def self.compute_utilization(_workspace, space)
    today_reservations = space.space_reservations
                              .active
                              .where(start_at: Time.current.all_day)
                              .count

    available_slots = 24 # 12 hours / 30-min slots
    reserved_pct = (today_reservations.to_f / available_slots * 100).round(1)

    { reserved_slots: today_reservations, percentage: reserved_pct }
  end
  private_class_method :compute_utilization
end
