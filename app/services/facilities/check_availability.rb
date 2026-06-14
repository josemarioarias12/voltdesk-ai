# frozen_string_literal: true

module Facilities
  class CheckAvailability
    SLOT_DURATION_MINUTES = 30
    BUSINESS_HOURS_START = 8
    BUSINESS_HOURS_END = 20

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
      @date.in_time_zone.change(hour: BUSINESS_HOURS_START)
    end

    def day_end
      @date.in_time_zone.change(hour: BUSINESS_HOURS_END)
    end

    def build_slots(reservations)
      slots = []
      current = day_start

      while current < day_end
        slot_end = current + SLOT_DURATION_MINUTES.minutes
        reserved = reservations.any? do |res|
          res.start_at < slot_end && res.end_at > current
        end

        slots << {
          start_at: current.iso8601,
          end_at: slot_end.iso8601,
          available: !reserved
        }

        current = slot_end
      end

      slots
    end
  end
end
