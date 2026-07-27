# frozen_string_literal: true

FactoryBot.define do
  factory :assistant_conversation do
    association :workspace
    association :user
  end
end
