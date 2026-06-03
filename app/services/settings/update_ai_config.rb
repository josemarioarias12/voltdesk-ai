# frozen_string_literal: true

module Settings
  class UpdateAiConfig
    VALID_PROVIDERS = Ai::ModelRouter::PROVIDER_ADAPTERS.keys.freeze
    VALID_MODES     = %w[automatic manual].freeze

    def self.call(workspace:, params:)
      new(workspace: workspace, params: params).call
    end

    def initialize(workspace:, params:)
      @workspace = workspace
      @params    = params
    end

    def call
      provider = @params[:ai_provider].to_s
      model    = @params[:ai_model].to_s
      fallback = @params[:ai_fallback_provider].to_s
      mode     = @params[:ai_selection_mode].to_s

      return ServiceResult.failure("Invalid provider: #{provider}") unless VALID_PROVIDERS.include?(provider)
      return ServiceResult.failure("Invalid mode: #{mode}") unless VALID_MODES.include?(mode)

      valid_models = Ai::ModelRouter::PROVIDER_MODELS[provider] || []
      return ServiceResult.failure("Invalid model #{model} for #{provider}") unless valid_models.include?(model)

      @workspace.update!(
        ai_provider: provider,
        ai_model: model,
        ai_fallback_provider: fallback.presence || 'openai',
        ai_selection_mode: mode
      )

      ServiceResult.success(@workspace)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end
  end
end
