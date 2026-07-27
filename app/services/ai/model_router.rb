# frozen_string_literal: true

module Ai
  class ModelRouter
    PROVIDER_ADAPTERS = {
      'openai' => Ai::Providers::OpenaiAdapter,
      'anthropic' => Ai::Providers::AnthropicAdapter,
      'gemini' => Ai::Providers::GeminiAdapter
    }.freeze

    PROVIDER_MODELS = {
      'openai' => %w[gpt-4o gpt-4o-mini gpt-4.1 gpt-4.1-mini gpt-5.2],
      'anthropic' => %w[claude-sonnet-5 claude-haiku-4-5-20251001],
      'gemini' => %w[gemini-2.0-flash gemini-1.5-pro]
    }.freeze

    # Source: official pricing pages, verified 2026-07-27.
    # OpenAI:    https://openai.com/api/pricing/
    # Anthropic: https://www.anthropic.com/pricing#api
    # Gemini:    https://ai.google.dev/pricing
    # gpt-5.2 is a placeholder estimate pending official confirmation.
    PROVIDER_COST_PER_1K = {
      'openai/gpt-4o' => 0.0075,
      'openai/gpt-4o-mini' => 0.00030,
      'openai/gpt-4.1' => 0.0075,
      'openai/gpt-4.1-mini' => 0.00030,
      'openai/gpt-5.2' => 0.0110,
      'anthropic/claude-sonnet-5' => 0.0076,
      'anthropic/claude-haiku-4-5-20251001' => 0.00040,
      'gemini/gemini-2.0-flash' => 0.00010,
      'gemini/gemini-1.5-pro' => 0.00175
    }.freeze

    EMBEDDING_PROVIDER = 'openai'
    ASSISTANT_OPERATIONS = %i[workspace_assistant_query].freeze

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

      primary_provider, primary_model = resolve_primary_config

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

    def resolve_primary_config
      if assistant_operation? && @workspace.ai_assistant_provider.present? && @workspace.ai_assistant_model.present?
        [@workspace.ai_assistant_provider, @workspace.ai_assistant_model]
      else
        [@workspace.ai_provider.presence || 'openai', @workspace.ai_model.presence || 'gpt-4o']
      end
    end

    def assistant_operation?
      ASSISTANT_OPERATIONS.include?(@operation.to_s.to_sym)
    end

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
      fallback = next_available_provider(excluding: failed_provider) if fallback == failed_provider
      Rails.logger.info("[ModelRouter] Using fallback provider: #{fallback}")
      adapter = build_adapter(fallback)
      model   = PROVIDER_MODELS[fallback]&.first || 'gpt-4o'
      [adapter, model, fallback]
    end

    def next_available_provider(excluding:)
      PROVIDER_ADAPTERS.keys.find { |provider| provider != excluding } || 'openai'
    end
  end
end
