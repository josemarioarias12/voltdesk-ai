# frozen_string_literal: true

FactoryBot.define do
  factory :workflow_rule do
    association :workspace
    name          { Faker::Lorem.sentence(word_count: 3) }
    trigger_event { :ticket_created }
    conditions    { [{ 'field' => 'urgency_score', 'operator' => 'gte', 'value' => '80' }] }
    actions       { [{ 'type' => 'escalate_priority', 'priority' => 'high' }] }
    active        { true }
    execution_count { 0 }
  end
end
