# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::CreateReservation do
  let(:workspace) { create(:workspace) }
  let(:employee)  { create(:user, workspace: workspace, role: :employee) }
  let(:space)     { create(:space, workspace: workspace, capacity: 4, name: 'Executive Lounge') }

  describe '.visible_to?' do
    it 'is visible to every active role, matching SpaceReservationPolicy#create? (no role restriction)' do
      %i[super_admin workspace_admin hr_manager it_manager facilities_manager operations_manager
         department_manager agent employee guest].each do |role|
        expect(described_class.visible_to?(build(:user, role: role, workspace: workspace))).to be(true)
      end
    end
  end

  describe '#call' do
    subject(:tool) { described_class.new(user: employee, workspace: workspace, locale: 'en') }

    let(:start_at) { 1.day.from_now.change(hour: 14) }
    let(:end_at) { 1.day.from_now.change(hour: 15) }

    context 'space name resolution' do
      before { space }

      it 'resolves an exact name match' do
        result = tool.call(space_name: 'Executive Lounge', title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s)

        expect(result).to be_success
        expect(result.data[:summary][:space_name]).to eq('Executive Lounge')
      end

      it 'resolves a case-insensitive exact match' do
        result = tool.call(space_name: 'executive lounge', title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s)

        expect(result).to be_success
      end

      it 'resolves a unique partial match' do
        result = tool.call(space_name: 'Executive', title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s)

        expect(result).to be_success
        expect(result.data[:summary][:space_name]).to eq('Executive Lounge')
      end

      it 'fails without raising when the name matches multiple spaces' do
        create(:space, workspace: workspace, name: 'Executive Boardroom')

        result = tool.call(space_name: 'Executive', title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s)

        expect(result).to be_failure
        expect(result.error).to include('matches multiple spaces')
      end

      it 'fails without raising when no space matches' do
        result = tool.call(space_name: 'Nonexistent Room', title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s)

        expect(result).to be_failure
        expect(result.error).to include('No space matches')
        expect(result.error).to include('Executive Lounge')
      end
    end

    context 'preview (confirmed omitted or false)' do
      it 'does not persist a reservation' do
        expect do
          tool.call(space_name: space.name, title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s)
        end.not_to change(SpaceReservation, :count)
      end

      it 'returns a preview summary with space details' do
        result = tool.call(space_name: space.name, title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s)

        expect(result).to be_success
        expect(result.data[:preview]).to be(true)
        expect(result.data[:summary][:space_name]).to eq(space.name)
        expect(result.data[:summary][:capacity]).to eq(4)
      end

      it 'fails without raising when attendees exceed capacity' do
        result = tool.call(space_name: space.name, title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s,
                           attendees_count: 10)

        expect(result).to be_failure
        expect(result.error).to include('would exceed capacity')
      end

      it 'fails without raising when combined attendees would exceed capacity for an overlapping time' do
        create(:space_reservation, space: space, workspace: workspace, start_at: start_at, end_at: end_at,
                                   attendees_count: 4)

        result = tool.call(space_name: space.name, title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s)

        expect(result).to be_failure
        expect(result.error).to include('would exceed capacity')
      end

      it 'allows an overlapping reservation when combined attendees fit within capacity' do
        create(:space_reservation, space: space, workspace: workspace, start_at: start_at, end_at: end_at,
                                   attendees_count: 2)

        result = tool.call(space_name: space.name, title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s)

        expect(result).to be_success
      end
    end

    context 'confirmed: true' do
      it 'persists a real reservation via Facilities::CreateReservation' do
        expect do
          tool.call(space_name: space.name, title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s, confirmed: true)
        end.to change(SpaceReservation, :count).by(1)
      end

      it 'creates the reservation as confirmed, owned by the current user' do
        result = tool.call(space_name: space.name, title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s,
                           confirmed: true)

        expect(result).to be_success
        expect(result.data[:reservation].user).to eq(employee)
        expect(result.data[:reservation].status).to eq('confirmed')
      end

      it 'returns a resource_link pointing to the reserved space' do
        result = tool.call(space_name: space.name, title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s,
                           confirmed: true)
        reservation = result.data[:reservation]

        expect(result.data[:resource_link]).to eq(
          title: "#{space.name} reservation",
          path: "/facilities/spaces/#{reservation.space_id}",
          icon: 'calendar'
        )
      end

      it 'resolves the same space by name even if the user phrased it slightly differently on confirm' do
        space
        result = tool.call(space_name: 'executive lounge', title: 'Sync', start_at: start_at.to_s, end_at: end_at.to_s,
                           confirmed: true)

        expect(result).to be_success
        expect(result.data[:reservation].space_id).to eq(space.id)
      end
    end

    context 'timezone normalization at the tool boundary' do
      let(:local_date) { 1.day.from_now.to_date }

      it 'does not report a conflict for an offset-less local time that only overlaps when misread as UTC' do
        create(:space_reservation, space: space, workspace: workspace, attendees_count: 4,
                                   start_at: Time.zone.parse("#{local_date} 15:00"),
                                   end_at: Time.zone.parse("#{local_date} 16:00"))

        result = tool.call(
          space_name: space.name, title: 'Evening sync',
          start_at: "#{local_date}T21:00:00", end_at: "#{local_date}T22:00:00",
          confirmed: true
        )

        expect(result).to be_success
        expect(SpaceReservation.last.start_at).to eq(Time.zone.parse("#{local_date} 21:00"))
      end

      it 'respects an explicit offset when provided' do
        result = tool.call(
          space_name: space.name, title: 'Offset sync',
          start_at: "#{local_date}T21:00:00-06:00", end_at: "#{local_date}T22:00:00-06:00",
          confirmed: true
        )

        expect(result).to be_success
        expect(SpaceReservation.last.start_at.utc).to eq(Time.zone.parse("#{local_date}T21:00:00-06:00").utc)
      end

      it 'fails cleanly on an unparseable time string' do
        result = tool.call(space_name: space.name, title: 'Bad', start_at: 'not-a-time', end_at: 'also-bad')

        expect(result).to be_failure
        expect(result.error).to eq('Invalid start or end time format')
      end
    end
  end
end
