# frozen_string_literal: true

FactoryBot.define do
  factory :ai_audit_log do
    association :workspace
    association :user

    operation         { :ticket_classification }
    model             { 'gpt-4o' }
    provider          { 'openai' }
    prompt            { "Classify this ticket: #{Faker::Lorem.sentence}" }
    response          { '{"category":"it","priority":"medium"}' }
    prompt_tokens     { 120 }
    completion_tokens { 60 }
    duration_ms       { rand(400..1200) }
    confidence_score  { rand(0.5..0.99).round(3) }
    status            { :success }
  end
end
