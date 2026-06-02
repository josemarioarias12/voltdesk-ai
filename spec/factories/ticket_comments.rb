# frozen_string_literal: true

FactoryBot.define do
  factory :ticket_comment do
    ticket
    user
    body     { Faker::Lorem.paragraph }
    internal { false }
  end
end
