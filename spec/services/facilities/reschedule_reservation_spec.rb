# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Facilities::RescheduleReservation do
  let(:workspace) { create(:workspace) }
  let(:user) { create(:user, workspace: workspace, role: :employee) }
  let(:space) { create(:space, workspace: workspace, capacity: 4) }
  let(:reservation) do
    create(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 2,
                               start_at: 1.day.from_now.change(hour: 10), end_at: 1.day.from_now.change(hour: 11))
  end

  it 'cancels the original and creates a reservation at the new time' do
    result = described_class.new(
      reservation: reservation,
      start_at: 1.day.from_now.change(hour: 14),
      end_at: 1.day.from_now.change(hour: 15)
    ).call

    expect(result).to be_success
    expect(reservation.reload.status).to eq('cancelled')
    expect(result.data.start_at).to eq(1.day.from_now.change(hour: 14))
    expect(result.data.attendees_count).to eq(2)
  end

  it 'keeps the original reservation intact when the new time conflicts' do
    create(:space_reservation, space: space, workspace: workspace, attendees_count: 4,
                               start_at: 1.day.from_now.change(hour: 14), end_at: 1.day.from_now.change(hour: 15))

    result = described_class.new(
      reservation: reservation,
      start_at: 1.day.from_now.change(hour: 14),
      end_at: 1.day.from_now.change(hour: 15)
    ).call

    expect(result).to be_failure
    expect(reservation.reload.status).to eq('confirmed')
  end

  it 'does not broadcast avatar_removed when rescheduling fails' do
    create(:space_reservation, space: space, workspace: workspace, attendees_count: 4,
                               start_at: 1.day.from_now.change(hour: 14), end_at: 1.day.from_now.change(hour: 15))
    allow(SpacesChannel).to receive(:broadcast_avatar_removed)

    described_class.new(
      reservation: reservation,
      start_at: 1.day.from_now.change(hour: 14),
      end_at: 1.day.from_now.change(hour: 15)
    ).call

    expect(SpacesChannel).not_to have_received(:broadcast_avatar_removed)
  end
end
