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
      return ServiceResult.failure(unknown_space_message) unless space

      return ServiceResult.failure('Space is not available') unless space.status_available?

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
        broadcast_avatar_position(reservation)
        ServiceResult.success(reservation)
      else
        ServiceResult.failure(reservation.errors.full_messages.join(', '))
      end
    end

    private

    def unknown_space_message
      valid = @workspace.spaces.order(:id).map { |s| "#{s.id}: #{s.name}" }.join(', ')
      "No space has id #{@params[:space_id]}. Valid space ids are — #{valid}."
    end

    def broadcast_update(space)
      SpacesChannel.broadcast_space_update(@workspace, space)
    end

    def broadcast_avatar_position(reservation)
      SpacesChannel.broadcast_avatar_position(@workspace, reservation)
    end
  end
end
