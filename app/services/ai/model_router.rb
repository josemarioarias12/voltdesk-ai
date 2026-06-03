# frozen_string_literal: true

module Ai
  class ModelRouter
    PROVIDER_ADAPTERS = {
      'openai' => Ai::Providers::OpenaiAdapter,
      'anthropic' => Ai::Providers::AnthropicAdapter,
      'gemini' => Ai::Providers::GeminiAdapter
    }.freeze

    PROVIDER_MODELS = {
      'openai' => %w[gpt-4o gpt-4o-mini gpt-4.1 gpt-4.1-mini],
      'anthropic' => %w[claude-sonnet-4-5 claude-haiku-4-5-20251001],
      'gemini' => %w[gemini-2.0-flash gemini-1.5-pro]
    }.freeze

    PROVIDER_COST_PER_1K = {
      'openai/gpt-4o' => 0.0075,
      'openai/gpt-4o-mini' => 0.00030,
      'openai/gpt-4.1' => 0.0075,
      'openai/gpt-4.1-mini' => 0.00030,
      'anthropic/claude-sonnet-4-5' => 0.0045,
      'anthropic/claude-haiku-4-5-20251001' => 0.00040,
      'gemini/gemini-2.0-flash' => 0.00010,
      'gemini/gemini-1.5-pro' => 0.00175
    }.freeze

    EMBEDDING_PROVIDER = 'openai'

    def self.for(workspace:, operation: :classification)
      new(workspace: workspace, operation: operation)
    end

    def self.provider_models = PROVIDER_MODELS
    def self.cost_per_1k(provider, model) = PROVIDER_COST_PER_1K["#{provider}/#{model}"] || 0.0

    def initialize(workspace:, operation:)
      @workspace = workspace
      @operation = operation
    end

    def resolve
      if embedding_operation?
        adapter = Ai::Providers::OpenaiAdapter.new
        return [adapter, Ai::Providers::OpenaiAdapter::EMBEDDING_MODEL, EMBEDDING_PROVIDER]
      end

      primary_provider = @workspace.ai_provider.presence || 'openai'
      primary_model    = @workspace.ai_model.presence    || 'gpt-4o'

      begin
        adapter = build_adapter(primary_provider)
        [adapter, primary_model, primary_provider]
      rescue StandardError => e
        Rails.logger.warn("[ModelRouter] Primary provider #{primary_provider} failed: #{e.message}. Trying fallback.")
        resolve_fallback(primary_provider)
      end
    end

    def estimated_cost_per_1k_calls
      provider = @workspace.ai_provider.presence || 'openai'
      model    = @workspace.ai_model.presence    || 'gpt-4o'
      self.class.cost_per_1k(provider, model) * 800
    end

    private

    def embedding_operation?
      @operation.to_s.include?('embedding')
    end

    def build_adapter(provider)
      klass = PROVIDER_ADAPTERS[provider]
      raise ArgumentError, "Unknown provider: #{provider}" unless klass

      klass.new
    end

    def resolve_fallback(failed_provider)
      fallback = @workspace.ai_fallback_provider.presence || 'openai'
      fallback = 'openai' if fallback == failed_provider
      Rails.logger.info("[ModelRouter] Using fallback provider: #{fallback}")
      adapter = build_adapter(fallback)
      model   = PROVIDER_MODELS[fallback]&.first || 'gpt-4o'
      [adapter, model, fallback]
    end
  end
end
