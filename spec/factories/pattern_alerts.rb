# frozen_string_literal: true

FactoryBot.define do
  factory :pattern_alert do
    association :workspace
    alert_type  { :ticket_cluster }
    severity    { :high }
    title       { '5 similar tickets detected in the last 2h' }
    description { 'Possible recurring incident.' }
    metadata    { { ticket_ids: [], ticket_numbers: [], detected_at: Time.current.iso8601 } }
    resolved_at { nil }
  end
end
