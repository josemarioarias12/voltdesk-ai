# frozen_string_literal: true

module Facilities
  class ReservationsController < ApplicationController
    def new
      space = policy_scope(Space).find(params.expect(:space_id))
      authorize SpaceReservation.new(workspace: current_workspace), :create?
      result = Facilities::CheckAvailability.new(
        space: space,
        date: params[:date] || Date.current
      ).call
      render inertia: 'Facilities/Reservations/New', props: {
        space: { id: space.id, name: space.name, capacity: space.capacity, floor: space.floor },
        slots: result.data,
        date: (params[:date] || Date.current).to_s
      }
    end

    def create
      authorize SpaceReservation.new(workspace: current_workspace), :create?
      result = Facilities::CreateReservation.new(
        workspace: current_workspace,
        user: current_user,
        params: reservation_params
      ).call

      if result.success?
        redirect_to facilities_space_path(reservation_params[:space_id]),
                    notice: 'Reservation confirmed successfully.'
      else
        redirect_back_or_to(new_facilities_reservation_path, alert: result.error)
      end
    end

    def cancel
      reservation = policy_scope(SpaceReservation).find(params.expect(:id))
      authorize reservation, :cancel?

      if reservation.update(status: :cancelled)
        SpacesChannel.broadcast_space_update(current_workspace, reservation.space)
        redirect_back_or_to(facilities_spaces_path, notice: 'Reservation cancelled.')
      else
        redirect_back_or_to(facilities_spaces_path, alert: 'Could not cancel reservation.')
      end
    end

    private

    def reservation_params
      params.expect(
        space_reservation: %i[space_id title start_at end_at attendees_count]
      )
    end
  end
end
