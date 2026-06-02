# frozen_string_literal: true

module Ai
  class ClassifyTicketJob < ApplicationJob
    queue_as :ai_processing

    def perform(ticket_id)
      # Full implementation in Sprint 4 — AI Engine.
      # Placeholder keeps CreateTicket service functional in S3.
      Rails.logger.info("[Ai::ClassifyTicketJob] ticket_id=#{ticket_id} — pending S4 implementation")
    end
  end
end
