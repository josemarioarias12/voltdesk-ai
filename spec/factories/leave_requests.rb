FactoryBot.define do
  factory :leave_request do
    association :workspace
    association :user

    leave_type  { :vacation }
    start_date  { 1.week.from_now.to_date }
    end_date    { 2.weeks.from_now.to_date }
    status      { :pending }
    reason      { 'Family vacation' }

    trait :approved do
      status { :approved }
      association :approved_by, factory: :user
    end

    trait :rejected do
      status           { :rejected }
      rejection_reason { 'Team at capacity' }
      association :approved_by, factory: :user
    end

    trait :sick do
      leave_type { :sick_leave }
      start_date { Date.today }
      end_date   { Date.today + 2.days }
    end
  end
end
