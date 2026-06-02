# frozen_string_literal: true

FactoryBot.define do
  factory :ticket_activity do
    ticket
    user
    action   { TicketActivity::CREATED }
    metadata { {} }
  end
end
