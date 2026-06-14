# frozen_string_literal: true

module Facilities
  class CreateReservation
    def initialize(workspace:, user:, params:)
      @workspace = workspace
      @user = user
      @params = params
    end

    def call
      space = @workspace.spaces.find_by(id: @params[:space_id])
      return ServiceResult.failure('Space not found') unless space

      return ServiceResult.failure('Space is not available') unless space.status_available?

      conflict = find_conflict(space, @params[:start_at], @params[:end_at])
      if conflict
        return ServiceResult.failure(
          "Space is already reserved from #{conflict.start_at.strftime('%H:%M')} " \
          "to #{conflict.end_at.strftime('%H:%M')} by #{conflict.user.full_name}"
        )
      end

      reservation = @workspace.space_reservations.build(
        space: space,
        user: @user,
        title: @params[:title],
        start_at: @params[:start_at],
        end_at: @params[:end_at],
        attendees_count: @params[:attendees_count] || 1,
        status: :confirmed
      )

      if reservation.save
        broadcast_update(space)
        ServiceResult.success(reservation)
      else
        ServiceResult.failure(reservation.errors.full_messages.join(', '))
      end
    end

    private

    def find_conflict(space, start_at, end_at)
      space.space_reservations
           .active
           .overlapping(start_at, end_at)
           .includes(:user)
           .first
    end

    def broadcast_update(space)
      SpacesChannel.broadcast_space_update(@workspace, space)
    end
  end
end
