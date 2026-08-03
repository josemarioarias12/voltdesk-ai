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

    # Per-model input/output pricing (USD per 1K tokens). A single
    # blended number can't represent real pricing since input/output
    # costs differ significantly per model.
    PROVIDER_TOKEN_PRICING = {
      # Verified 2026-07-29: https://developers.openai.com/api/docs/models/gpt-5.2
      'openai/gpt-5.2' => { input: 0.00175, output: 0.014 },

      # Not re-verified
      'openai/gpt-4o' => { input: 0.0075, output: 0.0075 },
      'openai/gpt-4o-mini' => { input: 0.00030, output: 0.00030 },
      'openai/gpt-4.1' => { input: 0.0075, output: 0.0075 },
      'openai/gpt-4.1-mini' => { input: 0.00030, output: 0.00030 },
      'anthropic/claude-sonnet-5' => { input: 0.0076, output: 0.0076 },
      'anthropic/claude-haiku-4-5-20251001' => { input: 0.00040, output: 0.00040 },
      'gemini/gemini-2.0-flash' => { input: 0.00010, output: 0.00010 },
      'gemini/gemini-1.5-pro' => { input: 0.00175, output: 0.00175 }
    }.freeze

    EMBEDDING_PROVIDER = 'openai'
    ASSISTANT_OPERATIONS = %i[workspace_assistant_query].freeze

    def self.for(workspace:, operation: :classification)
      new(workspace: workspace, operation: operation)
    end

    def self.provider_models = PROVIDER_MODELS

    def self.cost_per_1k(provider, model)
      cached = Rails.cache.fetch("ai_model_pricing/#{provider}/#{model}", expires_in: 1.hour) do
        Ai::ModelPricing.cost_per_1k(provider, model)
      end
      return cached if cached

      pricing = PROVIDER_TOKEN_PRICING["#{provider}/#{model}"]
      return 0.0 unless pricing

      (pricing[:input] + pricing[:output]) / 2.0
    end

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
