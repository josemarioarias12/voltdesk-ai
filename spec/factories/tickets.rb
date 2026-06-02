# frozen_string_literal: true

FactoryBot.define do
  factory :ticket do
    workspace
    department
    association :created_by, factory: :user
    title         { Faker::Lorem.sentence(word_count: 4) }
    description   { Faker::Lorem.paragraph }
    status        { :open }
    priority      { :medium }
    category      { :general }
    source        { :web }
    urgency_score { 50 }
    ai_metadata   { {} }
    sequence(:ticket_number) { |n| "TK-#{n.to_s.rjust(5, '0')}" }
  end
end
