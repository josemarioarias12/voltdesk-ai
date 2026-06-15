# frozen_string_literal: true

module Webhooks
  class TriggerService
    def self.call(workspace:, event:, payload:)
      new(workspace: workspace, event: event, payload: payload).call
    end

    def initialize(workspace:, event:, payload:)
      @workspace = workspace
      @event     = event
      @payload   = payload
    end

    def call
      webhooks = @workspace.webhooks.subscribed_to(@event)
      return ServiceResult.success(0) if webhooks.none?

      enqueued = 0
      webhooks.find_each do |webhook|
        Webhooks::DeliverJob.perform_later(webhook.id, @event, @payload)
        enqueued += 1
      end

      Rails.logger.info("[Webhooks::TriggerService] event=#{@event} workspace=#{@workspace.id} enqueued=#{enqueued}")
      ServiceResult.success(enqueued)
    rescue StandardError => e
      Rails.logger.error("[Webhooks::TriggerService] error=#{e.message}")
      ServiceResult.failure(e.message)
    end
  end
end
