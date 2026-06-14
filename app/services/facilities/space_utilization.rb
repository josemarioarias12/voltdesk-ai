# frozen_string_literal: true

module Facilities
  class SpaceUtilization
    BUSINESS_HOURS_PER_DAY = 12 # 08:00–20:00
    MINUTES_PER_DAY = BUSINESS_HOURS_PER_DAY * 60

    def initialize(workspace:, period_start:, period_end:)
      @workspace = workspace
      @period_start = period_start.beginning_of_day
      @period_end = period_end.end_of_day
    end

    def call
      spaces = @workspace.spaces.includes(:space_reservations)
      utilization = spaces.map { |space| calculate_for_space(space) }
      ServiceResult.success(utilization)
    end

    private

    def calculate_for_space(space)
      reservations = space.space_reservations
                          .active
                          .where(start_at: @period_start..@period_end)

      total_minutes = reservations.sum do |res|
        effective_end = [res.end_at, @period_end].min
        effective_start = [res.start_at, @period_start].max
        [(effective_end - effective_start) / 60.0, 0].max
      end

      business_days = count_business_days(@period_start.to_date, @period_end.to_date)
      available_minutes = business_days * MINUTES_PER_DAY
      utilization_pct = available_minutes.positive? ? (total_minutes / available_minutes * 100).round(2) : 0.0

      {
        space_id: space.id,
        space_name: space.name,
        floor: space.floor,
        space_type: space.space_type,
        capacity: space.capacity,
        total_reservations: reservations.count,
        total_minutes_reserved: total_minutes.round,
        available_minutes: available_minutes,
        utilization_percentage: utilization_pct,
        status: utilization_status(utilization_pct)
      }
    end

    def utilization_status(pct)
      if pct < 50
        'underutilized'
      elsif pct <= 80
        'optimal'
      else
        'overdemanded'
      end
    end

    def count_business_days(start_date, end_date)
      (start_date..end_date).count { |day| day.wday.between?(1, 5) }
    end
  end
end
