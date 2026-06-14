# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Facilities::CreateReservation do
  let(:workspace) { create(:workspace) }
  let(:user) { create(:user, workspace: workspace) }
  let(:space) { create(:space, workspace: workspace, status: :available, capacity: 10) }

  def call(overrides = {})
    params = {
      space_id: space.id,
      title: 'Team Sync',
      start_at: Time.zone.parse('2026-07-01 09:00'),
      end_at: Time.zone.parse('2026-07-01 10:00'),
      attendees_count: 5
    }.merge(overrides)

    described_class.new(workspace: workspace, user: user, params: params).call
  end

  describe '#call' do
    context 'when space is available' do
      it 'creates a confirmed reservation' do
        result = call
        expect(result).to be_success
        expect(result.data).to be_a(SpaceReservation)
        expect(result.data.status).to eq('confirmed')
      end
    end

    context 'when space does not exist' do
      it 'returns failure' do
        result = call(space_id: 0)
        expect(result).to be_failure
        expect(result.error).to eq('Space not found')
      end
    end

    context 'when space is under maintenance' do
      before { space.update!(status: :maintenance) }

      it 'returns failure' do
        result = call
        expect(result).to be_failure
        expect(result.error).to eq('Space is not available')
      end
    end

    context 'when there is a conflicting reservation' do
      before do
        create(:space_reservation,
               space: space,
               workspace: workspace,
               user: user,
               start_at: Time.zone.parse('2026-07-01 09:30'),
               end_at: Time.zone.parse('2026-07-01 10:30'),
               status: :confirmed)
      end

      it 'returns failure with conflict message' do
        result = call
        expect(result).to be_failure
        expect(result.error).to include('already reserved')
      end
    end

    context 'when existing reservation is cancelled' do
      before do
        create(:space_reservation,
               space: space,
               workspace: workspace,
               user: user,
               start_at: Time.zone.parse('2026-07-01 09:30'),
               end_at: Time.zone.parse('2026-07-01 10:30'),
               status: :cancelled)
      end

      it 'allows the reservation' do
        result = call
        expect(result).to be_success
      end
    end

    context 'when attendees exceed capacity' do
      it 'returns failure' do
        result = call(attendees_count: 20)
        expect(result).to be_failure
        expect(result.error).to include('capacity')
      end
    end
  end
end
