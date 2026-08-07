# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SpaceReservation do
  let(:workspace) { create(:workspace) }
  let(:user) { create(:user, workspace: workspace) }
  let(:space) { create(:space, workspace: workspace, capacity: 10) }

  describe 'capacity validation with overlapping reservations' do
    it 'allows multiple reservations for the same slot while combined attendees stay within capacity' do
      create(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 5,
                                 start_at: Time.zone.parse('2026-07-01 09:00'), end_at: Time.zone.parse('2026-07-01 10:00'))

      second = build(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 5,
                                         start_at: Time.zone.parse('2026-07-01 09:30'), end_at: Time.zone.parse('2026-07-01 10:30'))

      expect(second).to be_valid
    end

    it 'rejects a reservation once combined overlapping attendees would exceed capacity' do
      create(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 8,
                                 start_at: Time.zone.parse('2026-07-01 09:00'), end_at: Time.zone.parse('2026-07-01 10:00'))

      second = build(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 5,
                                         start_at: Time.zone.parse('2026-07-01 09:30'), end_at: Time.zone.parse('2026-07-01 10:30'))

      expect(second).not_to be_valid
      expect(second.errors[:attendees_count].join).to include('would exceed capacity')
    end

    it 'ignores cancelled reservations when computing reserved capacity' do
      create(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 8, status: :cancelled,
                                 start_at: Time.zone.parse('2026-07-01 09:00'), end_at: Time.zone.parse('2026-07-01 10:00'))

      second = build(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 5,
                                         start_at: Time.zone.parse('2026-07-01 09:30'), end_at: Time.zone.parse('2026-07-01 10:30'))

      expect(second).to be_valid
    end

    it 'excludes itself from the capacity count when updating an existing reservation' do
      existing = create(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 8,
                                            start_at: Time.zone.parse('2026-07-01 09:00'), end_at: Time.zone.parse('2026-07-01 10:00'))

      expect(existing.update(attendees_count: 9)).to be(true)
    end

    it 'does not conflict with reservations at a non-overlapping time regardless of capacity' do
      create(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 10,
                                 start_at: Time.zone.parse('2026-07-01 09:00'), end_at: Time.zone.parse('2026-07-01 10:00'))

      second = build(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 10,
                                         start_at: Time.zone.parse('2026-07-01 11:00'), end_at: Time.zone.parse('2026-07-01 12:00'))

      expect(second).to be_valid
    end
  end
end
