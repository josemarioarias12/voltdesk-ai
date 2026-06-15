# frozen_string_literal: true

module Settings
  class CreateApiKey
    def self.call(**args) = new(**args).call

    def initialize(workspace:, user:, params:, digest:)
      @workspace = workspace
      @user      = user
      @params    = params
      @digest    = digest
    end

    def call
      api_key = @workspace.api_keys.build(
        user:       @user,
        name:       @params[:name],
        scopes:     @params[:scopes] || [],
        key_digest: @digest
      )

      if api_key.save
        ServiceResult.success(api_key)
      else
        ServiceResult.failure(api_key.errors.full_messages.join(', '))
      end
    rescue StandardError => e
      Rails.logger.error("[Settings::CreateApiKey] #{e.message}")
      ServiceResult.failure('An unexpected error occurred.')
    end
  end
end
