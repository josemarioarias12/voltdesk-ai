# frozen_string_literal: true

FactoryBot.define do
  factory :onboarding_plan do
    association :workspace
    association :user

    status                 { :in_progress }
    completion_percentage  { 0 }
    target_completion_date { 30.days.from_now.to_date }
    ai_metadata            { {} }

    trait :completed do
      status                { :completed }
      completion_percentage { 100 }
    end
  end
end
