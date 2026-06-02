# frozen_string_literal: true

FactoryBot.define do
  factory :sla_policy do
    workspace
    name                 { "Standard #{priority.to_s.capitalize} SLA" }
    priority             { :medium }
    first_response_hours { 4 }
    resolution_hours     { 24 }
  end
end
