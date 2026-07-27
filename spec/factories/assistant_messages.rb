# frozen_string_literal: true

FactoryBot.define do
  factory :assistant_message do
    association :assistant_conversation
    role    { :user }
    content { Faker::Lorem.sentence }
  end
end
