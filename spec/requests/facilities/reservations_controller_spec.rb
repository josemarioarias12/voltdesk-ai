# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Facilities::ReservationsController, type: :request do
  let(:workspace) { create(:workspace) }
  let(:employee)  { create(:user, workspace: workspace, role: :employee) }
  let(:space)     { create(:space, workspace: workspace, capacity: 10) }

  describe 'POST /facilities/spaces/:space_id/reservations' do
    before { sign_in employee }

    let(:valid_params) do
      {
        space_id: space.id,
        title: 'Q3 Planning Session',
        start_at: 1.day.from_now.change(hour: 9, min: 0).iso8601,
        end_at: 1.day.from_now.change(hour: 9, min: 30).iso8601,
        attendees_count: 3
      }
    end

    it 'creates a reservation from the plain params sent by New.tsx, relying on wrap_parameters' do
      expect do
        post facilities_space_reservations_path(space), params: valid_params, as: :json
      end.to change(SpaceReservation, :count).by(1)
    end

    it 'redirects after creation' do
      post facilities_space_reservations_path(space), params: valid_params, as: :json
      expect(response).to have_http_status(:redirect)
    end

    it 'persists the correct attributes' do
      post facilities_space_reservations_path(space), params: valid_params, as: :json
      reservation = SpaceReservation.last
      expect(reservation.title).to eq('Q3 Planning Session')
      expect(reservation.attendees_count).to eq(3)
      expect(reservation.user).to eq(employee)
      expect(reservation.space).to eq(space)
    end

    context 'when attendees exceed capacity' do
      let(:valid_params) do
        super().merge(attendees_count: 999)
      end

      it 'does not create a reservation and redirects with an alert' do
        expect do
          post facilities_space_reservations_path(space), params: valid_params, as: :json
        end.not_to change(SpaceReservation, :count)
        expect(response).to have_http_status(:redirect)
      end
    end
  end
end
