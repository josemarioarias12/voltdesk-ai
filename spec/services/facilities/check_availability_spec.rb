# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Facilities::CheckAvailability do
  let(:workspace) { create(:workspace) }
  let(:user) { create(:user, workspace: workspace) }
  let(:space) { create(:space, workspace: workspace, capacity: 4) }
  let(:date) { Date.parse('2026-07-01') }

  describe '#call' do
    it 'covers the full day, from midnight to midnight' do
      result = described_class.new(space: space, date: date).call

      expect(result).to be_success
      expect(result.data.first[:start_at]).to eq(Time.zone.parse('2026-07-01 00:00').iso8601)
      expect(result.data.last[:end_at]).to eq(Time.zone.parse('2026-07-01 23:59:59').iso8601)
    end

    it 'marks a slot available when reserved attendees are below capacity' do
      create(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 2,
                                 start_at: Time.zone.parse('2026-07-01 21:00'), end_at: Time.zone.parse('2026-07-01 22:00'))

      result = described_class.new(space: space, date: date).call
      slot = result.data.find { |s| s[:start_at] == Time.zone.parse('2026-07-01 21:00').iso8601 }

      expect(slot[:available]).to be(true)
      expect(slot[:remaining]).to eq(2)
    end

    it 'marks a slot unavailable once reserved attendees reach capacity' do
      create(:space_reservation, space: space, workspace: workspace, user: user, attendees_count: 4,
                                 start_at: Time.zone.parse('2026-07-01 21:00'), end_at: Time.zone.parse('2026-07-01 22:00'))

      result = described_class.new(space: space, date: date).call
      slot = result.data.find { |s| s[:start_at] == Time.zone.parse('2026-07-01 21:00').iso8601 }

      expect(slot[:available]).to be(false)
      expect(slot[:remaining]).to eq(0)
    end
  end
end
