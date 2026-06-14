# frozen_string_literal: true

FactoryBot.define do
  factory :space_reservation do
    association :workspace
    association :space
    association :user
    title { 'Team Meeting' }
    start_at { 1.day.from_now.change(hour: 9, min: 0) }
    end_at { 1.day.from_now.change(hour: 10, min: 0) }
    attendees_count { 5 }
    status { :confirmed }
  end
end
