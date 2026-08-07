# frozen_string_literal: true

module Facilities
  class RescheduleReservation
    def initialize(reservation:, start_at:, end_at:)
      @reservation = reservation
      @start_at = start_at
      @end_at = end_at
    end

    def call
      new_reservation = nil

      ActiveRecord::Base.transaction do
        @reservation.update!(status: :cancelled)

        result = Facilities::CreateReservation.new(
          workspace: @reservation.workspace,
          user: @reservation.user,
          params: {
            space_id: @reservation.space_id,
            title: @reservation.title,
            start_at: @start_at,
            end_at: @end_at,
            attendees_count: @reservation.attendees_count
          }
        ).call

        raise ActiveRecord::Rollback unless result.success?

        new_reservation = result.data
      end

      return ServiceResult.failure('New time is not available') unless new_reservation

      SpacesChannel.broadcast_avatar_removed(@reservation.workspace, @reservation)
      ServiceResult.success(new_reservation)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end
  end
end
