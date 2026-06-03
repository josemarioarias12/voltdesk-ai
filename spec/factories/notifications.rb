FactoryBot.define do
  factory :notification do
    association :workspace
    association :user

    title             { 'Test notification' }
    body              { 'This is a test notification body.' }
    notification_type { :ticket_assigned }
    resource_type     { 'Ticket' }
    resource_id       { 1 }
    read              { false }

    trait :read do
      read { true }
    end

    trait :leave_submitted do
      notification_type { :leave_request_submitted }
      resource_type     { 'LeaveRequest' }
    end

    trait :onboarding_ready do
      notification_type { :onboarding_plan_ready }
      resource_type     { 'OnboardingPlan' }
    end
  end
end
