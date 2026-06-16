# frozen_string_literal: true

FactoryBot.define do
  factory :classification_correction do
    association :workspace
    association :ticket
    association :agent, factory: :user
    original_category  { 'billing' }
    corrected_category { 'technical_support' }
    correction_note    { nil }
  end
end
