# frozen_string_literal: true

module Facilities
  class SpacesController < ApplicationController
    def index
      spaces = policy_scope(Space).order(:id)
      render inertia: 'Facilities/Spaces/Index', props: {
        spaces: spaces.includes(:space_reservations).map { |space| serialize_space(space) },
        panel_slots: panel_slots_prop,
        active_presences: active_presences_prop,
        my_panel_reservation: my_panel_reservation_prop
      }
    end

    def show
      space = policy_scope(Space).find(params.expect(:id))
      authorize space
      reservations = space.space_reservations.active.upcoming.includes(:user).order(:start_at)
      render inertia: 'Facilities/Spaces/Show', props: {
        space: serialize_space(space),
        reservations: reservations.map { |res| serialize_reservation(res) }
      }
    end

    def optimize
      authorize Space.new(workspace: current_workspace), :optimize?
      result = Ai::SpaceOptimizer.new(
        workspace: current_workspace,
        requested_by: current_user
      ).call
      # JSON response required — called via fetch() from Utilization.tsx, not Inertia
      if result.success?
        render json: result.data
      else
        render json: { error: result.error }, status: :unprocessable_content
      end
    end

    def utilization
      authorize Space.new(workspace: current_workspace), :utilization?
      result = Facilities::SpaceUtilization.new(
        workspace: current_workspace,
        period_start: params[:period_start] || 90.days.ago,
        period_end: params[:period_end] || Time.current
      ).call
      render inertia: 'Facilities/Spaces/Utilization', props: { utilization: result.data }
    end

    private

    def panel_slots_prop
      return nil if params[:panel_space_id].blank?

      space = policy_scope(Space).find_by(id: params[:panel_space_id])
      return nil unless space

      Facilities::CheckAvailability.new(space: space, date: Date.current).call.data
    end

    def active_presences_prop
      current_workspace.space_reservations
                       .active
                       .includes(:user)
                       .where('end_at > ? AND start_at <= ?', Time.current, Time.current.end_of_day)
                       .map do |res|
        {
          space_id: res.space_id,
          user_id: res.user_id,
          user_name: res.user.full_name,
          avatar_url: SpacesChannel.avatar_url_for(res.user),
          end_at: res.end_at.iso8601
        }
      end
    end

    def my_panel_reservation_prop
      return nil if params[:panel_space_id].blank?

      res = policy_scope(SpaceReservation)
            .active
            .where(space_id: params[:panel_space_id], user_id: current_user.id)
            .where('end_at > ?', Time.current)
            .order(:start_at)
            .first
      return nil unless res

      { id: res.id, start_at: res.start_at.iso8601, end_at: res.end_at.iso8601 }
    end

    def serialize_space(space)
      today = space.space_reservations.active.where(start_at: Time.current.all_day).count
      {
        id: space.id, name: space.name, floor: space.floor,
        capacity: space.capacity, status: space.status,
        space_type: space.space_type, equipment: space.equipment,
        reservations_today: today,
        reserved_soon: reserved_soon?(space),
        utilization_today: SpacesChannel.compute_utilization(current_workspace, space)
      }
    end

    def reserved_soon?(space)
      now = Time.current
      space.space_reservations.any? do |res|
        res.status != 'cancelled' && res.start_at > now && res.start_at <= now + 1.hour
      end
    end

    def serialize_reservation(res)
      {
        id: res.id, title: res.title, start_at: res.start_at,
        end_at: res.end_at, attendees_count: res.attendees_count,
        status: res.status, user: { id: res.user.id, name: res.user.full_name }
      }
    end
  end
end
