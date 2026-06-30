# frozen_string_literal: true

module Webhooks
  class DeliverJob < ApplicationJob
    queue_as :webhooks
    sidekiq_options retry: 3

    def perform(webhook_id, event, payload)
      webhook = Webhook.find_by(id: webhook_id)
      return unless webhook&.active?

      body    = payload.to_json
      success = deliver(webhook, event, body)

      if success
        # rubocop:disable Rails/SkipsModelValidations
        webhook.update_columns(last_triggered_at: Time.current, failure_count: 0)
        # rubocop:enable Rails/SkipsModelValidations
      else
        handle_failure(webhook)
      end
    end

    private

    def deliver(webhook, event, body)
      uri          = URI.parse(webhook.url)
      http         = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.open_timeout = 10
      http.read_timeout = 10

      request                            = Net::HTTP::Post.new(uri.request_uri)
      request['Content-Type']            = 'application/json'
      request['X-VoltDesk-Event']       = event
      request['X-VoltDesk-Signature']   = webhook.sign(body)
      request['X-VoltDesk-Delivery']    = SecureRandom.uuid
      request.body = body

      response = http.request(request)
      Rails.logger.info("[Webhooks::DeliverJob] webhook=#{webhook.id} event=#{event} status=#{response.code}")
      response.code.to_i < 500
    rescue StandardError => e
      Rails.logger.error("[Webhooks::DeliverJob] webhook=#{webhook.id} error=#{e.message}")
      false
    end

    def handle_failure(webhook)
      new_count = webhook.failure_count + 1
      # rubocop:disable Rails/SkipsModelValidations
      if new_count >= 3
        webhook.update_columns(failure_count: new_count, active: false)
        Rails.logger.warn("[Webhooks::DeliverJob] webhook=#{webhook.id} deactivated after #{new_count} failures")
      else
        webhook.update_column(:failure_count, new_count)
      end
      # rubocop:enable Rails/SkipsModelValidations
    end
  end
end
