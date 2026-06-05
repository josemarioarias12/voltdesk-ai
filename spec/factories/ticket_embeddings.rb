# frozen_string_literal: true

FactoryBot.define do
  factory :ticket_embedding do
    association :ticket
    association :workspace
    content   { ticket.title }
    embedding { Array.new(1536) { rand(-1.0..1.0) } }
  end
end
