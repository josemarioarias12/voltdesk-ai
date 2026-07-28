# frozen_string_literal: true

FactoryBot.define do
  factory :assistant_conversation do
    association :workspace
    association :user

    trait :archived do
      archived_at { 1.day.ago }
    end
  end
end
