# frozen_string_literal: true

module Facilities
  class CheckAvailability
    SLOT_DURATION_MINUTES = 30

    def initialize(space:, date:)
      @space = space
      @date = date.to_date
    end

    def call
      reservations = @space.space_reservations
                           .active
                           .where(start_at: day_start..day_end)
                           .order(:start_at)

      slots = build_slots(reservations)
      ServiceResult.success(slots)
    end

    private

    def day_start
      @date.in_time_zone.beginning_of_day
    end

    def day_end
      @date.in_time_zone.end_of_day
    end

    def build_slots(reservations)
      slots = []
      current = day_start

      while current < day_end
        slot_end = [current + SLOT_DURATION_MINUTES.minutes, day_end].min
        reserved = reservations.select { |res| res.start_at < slot_end && res.end_at > current }
                               .sum(&:attendees_count)

        slots << {
          start_at: current.iso8601,
          end_at: slot_end.iso8601,
          available: reserved < @space.capacity,
          remaining: [@space.capacity - reserved, 0].max
        }

        current = slot_end
      end

      slots
    end
  end
end
