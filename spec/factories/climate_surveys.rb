# frozen_string_literal: true

FactoryBot.define do
  factory :climate_survey do
    association :workspace
    association :created_by, factory: :user

    title { 'Q1 2026 Employee Satisfaction' }
    status { :draft }

    trait :active do
      status { :active }
    end

    trait :closed do
      status { :closed }
    end

    trait :for_department do
      association :department
    end
  end
end
