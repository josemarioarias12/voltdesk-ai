# frozen_string_literal: true

FactoryBot.define do
  factory :department do
    association :workspace
    name  { Faker::Commerce.unique.department }
    color { Department::COLORS.sample }
    icon  { Department::ICONS.sample }
  end
end
