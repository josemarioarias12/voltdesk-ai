# frozen_string_literal: true

module Facilities
  class SpacesController < ApplicationController
    def index
      spaces = policy_scope(Space)
      render inertia: 'Facilities/Spaces/Index', props: {
        spaces: spaces.includes(:space_reservations).map { |space| serialize_space(space) }
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

    def serialize_space(space)
      today = space.space_reservations.active.where(start_at: Time.current.all_day).count
      {
        id: space.id, name: space.name, floor: space.floor,
        capacity: space.capacity, status: space.status,
        space_type: space.space_type, equipment: space.equipment,
        reservations_today: today
      }
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
