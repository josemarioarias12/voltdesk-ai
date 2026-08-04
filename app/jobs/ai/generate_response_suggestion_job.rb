# frozen_string_literal: true

module Ai
  class GenerateResponseSuggestionJob < ApplicationJob
    queue_as :ai_processing

    def perform(ticket_id)
      ticket = Ticket.find(ticket_id)
      result = Ai::ResponseSuggester.call(ticket: ticket)

      payload = if result.success? && result.data.present?
                  result.data.stringify_keys.merge('found' => true)
                else
                  { 'found' => false }
                end

      ticket.update!(ai_metadata: (ticket.ai_metadata || {}).merge('response_suggestion' => payload))

      ActionCable.server.broadcast("ticket:#{ticket.id}", { event: 'response_suggestion_ready' })
    rescue StandardError => e
      Rails.logger.error("[Ai::GenerateResponseSuggestionJob] ticket=#{ticket_id} error=#{e.message}")
    end
  end
end
