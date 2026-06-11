# frozen_string_literal: true

module Workflows
  class EvaluateRulesJob < ApplicationJob
    queue_as :default

    def perform(ticket_id, event)
      ticket = Ticket.includes(:workspace).find_by(id: ticket_id)
      return unless ticket

      Workflows::EvaluateRules.call(ticket:, event: event.to_sym)
    end
  end
end
