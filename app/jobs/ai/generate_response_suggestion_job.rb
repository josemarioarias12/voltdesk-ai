# frozen_string_literal: true

module Ai
  class GenerateResponseSuggestionJob < ApplicationJob
    queue_as :ai_processing

    def perform(ticket_id, user_id = nil)
      ticket = Ticket.find(ticket_id)
      user   = user_id ? User.find_by(id: user_id) : nil
      result = Ai::ResponseSuggester.call(ticket: ticket, user: user)

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
