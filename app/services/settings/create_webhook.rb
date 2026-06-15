# frozen_string_literal: true

module Settings
  class CreateWebhook
    def self.call(**args) = new(**args).call

    def initialize(workspace:, params:, digest:)
      @workspace = workspace
      @params    = params
      @digest    = digest
    end

    def call
      webhook = @workspace.webhooks.build(
        name:          @params[:name],
        url:           @params[:url],
        events:        @params[:events] || [],
        secret_digest: @digest
      )

      if webhook.save
        ServiceResult.success(webhook)
      else
        ServiceResult.failure(webhook.errors.full_messages.join(', '))
      end
    rescue StandardError => e
      Rails.logger.error("[Settings::CreateWebhook] #{e.message}")
      ServiceResult.failure('An unexpected error occurred.')
    end
  end
end
