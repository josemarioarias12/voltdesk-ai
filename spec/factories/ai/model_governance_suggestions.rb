# frozen_string_literal: true

FactoryBot.define do
  factory :ai_model_governance_suggestion, class: 'Ai::ModelGovernanceSuggestion' do
    provider { 'openai' }
    model { 'gpt-4o' }
    suggestion_type { :pricing_update }
    result { {} }
  end
end
