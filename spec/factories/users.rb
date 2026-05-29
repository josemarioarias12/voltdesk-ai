# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    association :workspace
    first_name  { Faker::Name.first_name }
    last_name   { Faker::Name.last_name }
    email       { Faker::Internet.unique.email }
    password    { 'Password123!' }
    role        { :employee }
    active      { true }

    trait :super_admin do
      role      { :super_admin }
      workspace { nil }
    end

    trait :workspace_admin do
      role { :workspace_admin }
    end

    trait :hr_manager do
      role { :hr_manager }
    end

    trait :it_manager do
      role { :it_manager }
    end

    trait :facilities_manager do
      role { :facilities_manager }
    end

    trait :operations_manager do
      role { :operations_manager }
    end

    trait :department_manager do
      role { :department_manager }
    end

    trait :agent do
      role { :agent }
    end

    trait :employee do
      role { :employee }
    end

    trait :guest do
      role { :guest }
    end
  end
end
