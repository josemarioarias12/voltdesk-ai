# frozen_string_literal: true

FactoryBot.define do
  factory :api_key do
    association :workspace
    association :user
    name        { Faker::App.name }
    key_digest  { Digest::SHA256.hexdigest(SecureRandom.hex(32)) }
    active      { true }
    scopes      { ['tickets:read', 'tickets:create'] }
  end
end
