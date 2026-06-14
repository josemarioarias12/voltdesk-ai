# frozen_string_literal: true

FactoryBot.define do
  factory :space do
    association :workspace
    name { "Meeting Room #{rand(100)}" }
    floor { '1' }
    capacity { 10 }
    equipment { { projector: true, whiteboard: true } }
    status { :available }
    space_type { :meeting_room }
  end
end
