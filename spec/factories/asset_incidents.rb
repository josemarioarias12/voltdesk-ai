# frozen_string_literal: true

FactoryBot.define do
  factory :asset_incident do
    association :asset
    association :workspace
    sequence(:title) { |n| "Incident #{n}" }
    severity         { :medium }
    status           { :open }
  end
end
