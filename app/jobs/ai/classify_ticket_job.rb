# frozen_string_literal: true

module Ai
  class ClassifyTicketJob < ApplicationJob
    queue_as :ai_processing

    sidekiq_options retry: 3, dead: true

    sidekiq_retry_in do |count, _exception|
      (2**count).seconds.to_i
    end

    sidekiq_retries_exhausted do |msg|
      ticket_id = msg['args'].first
      ticket    = Ticket.find_by(id: ticket_id)
      next unless ticket

      ticket.update_columns(status: Ticket.statuses[:pending_classification])
      notify_workspace_admin_once(ticket)
    end

    def perform(ticket_id)
      ticket = Ticket.find(ticket_id)

      classification_result = Ai::TicketClassifier.call(ticket: ticket)

      raise ClassificationError, classification_result.error if classification_result.failure?

      embed_result = Ai::EmbeddingGenerator.call(ticket: ticket.reload)

      if embed_result.failure?
        Rails.logger.warn("[ClassifyTicketJob] Embedding failed for ticket #{ticket.id}: #{embed_result.error}")
      end

      ActionCable.server.broadcast(
        "workspace_#{ticket.workspace_id}_tickets",
        {
          type: 'ticket_classified',
          ticket_id: ticket.id,
          ticket: serialize_ticket_for_broadcast(ticket)
        }
      )
    end

    private

    def self.notify_workspace_admin_once(ticket)
      dedup_key = "ai_failure_notified:#{ticket.workspace_id}:#{Time.current.strftime('%Y%m%d%H')}"
      return if Redis.current.exists?(dedup_key)

      Redis.current.setex(dedup_key, 1.hour.to_i, '1')

      admin = ticket.workspace.users.where(role: :workspace_admin, active: true).first
      return unless admin

      Notification.create!(
        workspace: ticket.workspace,
        user: admin,
        title: 'AI Classification Failed',
        body: "Ticket #{ticket.ticket_number} could not be auto-classified after 3 attempts. Manual review required.",
        notification_type: :system_alert,
        resource_type: 'Ticket',
        resource_id: ticket.id
      )
    rescue StandardError => e
      Rails.logger.error("[ClassifyTicketJob] Failed to send admin notification: #{e.message}")
    end

    def serialize_ticket_for_broadcast(ticket)
      {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        category: ticket.category,
        priority: ticket.priority,
        urgency_score: ticket.urgency_score,
        status: ticket.status,
        ai_metadata: ticket.ai_metadata
      }
    end
  end

  class ClassificationError < StandardError
  end
end
