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

      assistant_result = validate_assistant_override
      return assistant_result if assistant_result.failure?

      @workspace.update!(
        ai_provider: provider,
        ai_model: model,
        ai_fallback_provider: fallback.presence || 'openai',
        ai_selection_mode: mode,
        ai_assistant_provider: assistant_result.data[:provider],
        ai_assistant_model: assistant_result.data[:model]
      )

      ServiceResult.success(@workspace)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    # Both blank is a valid state: no override, the assistant uses the
    # workspace's general ai_provider/ai_model. One present without the
    # other is not allowed — it would leave an incomplete configuration.
    def validate_assistant_override
      assistant_provider = @params[:ai_assistant_provider].to_s
      assistant_model    = @params[:ai_assistant_model].to_s

      return ServiceResult.success({ provider: nil, model: nil }) if assistant_provider.blank? && assistant_model.blank?

      unless VALID_PROVIDERS.include?(assistant_provider)
        return ServiceResult.failure("Invalid assistant provider: #{assistant_provider}")
      end

      valid_assistant_models = Ai::ModelRouter::PROVIDER_MODELS[assistant_provider] || []
      unless valid_assistant_models.include?(assistant_model)
        return ServiceResult.failure("Invalid assistant model #{assistant_model} for #{assistant_provider}")
      end

      ServiceResult.success({ provider: assistant_provider, model: assistant_model })
    end
  end
end
