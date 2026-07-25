# frozen_string_literal: true

FactoryBot.define do
  factory :leave_policy do
    association :workspace

    max_concurrent { 3 }
    min_notice_days { 0 }
    requires_second_approval { false }
    active { true }

    trait :for_department do
      association :department
    end

    trait :for_vacation do
      leave_type { :vacation }
    end

    trait :with_second_approval do
      requires_second_approval { true }
      second_approval_threshold_days { 5 }
    end
  end
end
