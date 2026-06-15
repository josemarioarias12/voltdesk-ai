# frozen_string_literal: true

FactoryBot.define do
  factory :ticket_satisfaction_survey do
    association :workspace
    association :ticket
    association :department
    association :submitted_by, factory: :user

    sentiment_score { rand(-1.0..1.0).round(3) }
    rating          { rand(1..5) }
    feedback        { "Service was #{%w[great okay poor].sample}" }
    ai_themes       { [] }
  end
end
