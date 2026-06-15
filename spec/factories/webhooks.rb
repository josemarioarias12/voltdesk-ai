# frozen_string_literal: true

FactoryBot.define do
  factory :webhook do
    association :workspace
    name          { Faker::App.name }
    url           { 'https://example.com/webhook' }
    secret_digest { Digest::SHA256.hexdigest(SecureRandom.hex(32)) }
    events        { ['ticket.created'] }
    active        { true }
    failure_count { 0 }
  end
end
