# frozen_string_literal: true

FactoryBot.define do
  factory :agent_action do
    association :workspace
    association :ticket
    action_type { :auto_resolve }
    status      { :pending_approval }
    confidence  { 0.90 }
    result      { {} }
    executed_at { nil }
    approved_by { nil }
  end
end
