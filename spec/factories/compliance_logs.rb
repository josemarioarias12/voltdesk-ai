# frozen_string_literal: true

FactoryBot.define do
  factory :compliance_log do
    association :workspace
    association :actor, factory: :user
    resource_type { 'Ticket' }
    resource_id   { 1 }
    event_type    { :sensitive_access }
    ip_address    { '127.0.0.1' }
    metadata      { {} }
  end
end
