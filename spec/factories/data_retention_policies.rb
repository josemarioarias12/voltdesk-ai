# frozen_string_literal: true

FactoryBot.define do
  factory :data_retention_policy do
    association :workspace
    resource_type  { 'tickets' }
    retention_days { 1825 }
    auto_purge     { false }
    last_purge_at  { nil }
  end
end
