# frozen_string_literal: true

module Settings
  class WebhooksController < ApplicationController
    before_action :authenticate_user!

    def index
      authorize current_workspace, :manage_webhooks?
      webhooks = current_workspace.webhooks.order(created_at: :desc)
      render inertia: 'Settings/Webhooks/Index', props: {
        webhooks:         webhooks.map { |wh| serialize_webhook(wh) },
        supported_events: Webhook::SUPPORTED_EVENTS
      }
    end

    def create
      authorize current_workspace, :manage_webhooks?
      secret, digest = Webhook.generate_secret
      result = Settings::CreateWebhook.call(
        workspace: current_workspace,
        params:    webhook_params,
        digest:    digest
      )

      if result.success?
        render inertia: 'Settings/Webhooks/Index', props: {
          webhooks:         current_workspace.webhooks.order(created_at: :desc)
                                             .map { |wh| serialize_webhook(wh) },
          supported_events: Webhook::SUPPORTED_EVENTS,
          new_secret:       secret
        }
      else
        redirect_to settings_webhooks_path, alert: result.error
      end
    end

    def destroy
      authorize current_workspace, :manage_webhooks?
      webhook = current_workspace.webhooks.find(params.expect(:id))
      webhook.destroy!
      redirect_to settings_webhooks_path, notice: 'Webhook deleted.'
    end

    def toggle
      authorize current_workspace, :manage_webhooks?
      webhook = current_workspace.webhooks.find(params.expect(:id))
      webhook.update!(active: !webhook.active)
      redirect_to settings_webhooks_path,
                  notice: "Webhook #{webhook.active? ? 'activated' : 'deactivated'}."
    end

    private

    def webhook_params
      params.expect(webhook: [:name, :url, { events: [] }])
    end

    def serialize_webhook(webhook)
      {
        id:               webhook.id,
        name:             webhook.name,
        url:              webhook.url,
        events:           webhook.events,
        active:           webhook.active,
        failure_count:    webhook.failure_count,
        last_triggered_at: webhook.last_triggered_at&.iso8601,
        created_at:       webhook.created_at.iso8601
      }
    end
  end
end
