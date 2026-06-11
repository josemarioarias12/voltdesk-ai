# frozen_string_literal: true

module Ai
  class AgentOrchestratorJob < ApplicationJob
    queue_as :ai_processing

    def perform(ticket_id)
      ticket = Ticket.includes(:workspace).find_by(id: ticket_id)
      return unless ticket
      return if ticket.status_resolved? || ticket.status_closed?

      threshold = ticket.workspace.settings.fetch('agent_threshold', 0.85).to_f
      return unless ticket.urgency_score.to_f >= threshold

      Ai::AgentOrchestrator.call(ticket:)
    end
  end
end
