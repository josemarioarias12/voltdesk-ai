# frozen_string_literal: true

FactoryBot.define do
  factory :workspace do
    name   { Faker::Company.name }
    slug   { Faker::Internet.unique.slug(glue: '-') }
    plan   { 'starter' }
    active { true }
  end
end
