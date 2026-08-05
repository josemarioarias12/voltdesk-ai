# frozen_string_literal: true

module Ai
  class CheckModelDeprecation
    VERIFY_URLS = {
      'openai'    => 'https://platform.openai.com/docs/models',
      'anthropic' => 'https://docs.claude.com/en/docs/about-claude/models/overview',
      'gemini'    => 'https://ai.google.dev/gemini-api/docs/models'
    }.freeze

    def self.call
      new.call
    end

    def call
      results = Ai::ModelRouter::PROVIDER_MODELS.flat_map { |provider, models| check_provider(provider, models) }
      flagged = results.select { |r| r[:flagged] }

      ServiceResult.success(
        checked: results.size, flagged: flagged.size, suggestion_ids: flagged.pluck(:suggestion_id)
      )
    rescue StandardError => e
      Rails.logger.error("[Ai::CheckModelDeprecation] #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def check_provider(provider, models)
      live_ids = fetch_live_model_ids(provider)
      return models.map { |model| skip(provider, model, 'provider_unreachable') } if live_ids.nil?

      models.map { |model| check_model(provider, model, live_ids) }
    end

    def fetch_live_model_ids(provider)
      adapter_class = Ai::ModelRouter::PROVIDER_ADAPTERS[provider]
      return nil unless adapter_class

      adapter_class.new.list_model_ids
    rescue StandardError => e
      Rails.logger.warn("[Ai::CheckModelDeprecation] #{provider} unreachable: #{e.message}")
      nil
    end

    def check_model(provider, model, live_ids)
      return { flagged: false } if live_ids.include?(model)

      suggestion_id = upsert_suggestion(provider, model, live_ids)
      return { flagged: false } if suggestion_id.nil?

      { flagged: true, suggestion_id: suggestion_id }
    end

    def skip(provider, model, reason)
      Rails.logger.info("[Ai::CheckModelDeprecation] #{provider}/#{model}: not verified (#{reason})")
      { flagged: false }
    end

    def upsert_suggestion(provider, model, live_ids)
      decided = Ai::ModelGovernanceSuggestion.most_recent_decided(provider, model, :model_deprecation)
      if decided
        Rails.logger.info(
          "[Ai::CheckModelDeprecation] #{provider}/#{model}: already reviewed (status: #{decided.status})"
        )
        return nil
      end

      suggestion = Ai::ModelGovernanceSuggestion.find_or_initialize_by(
        provider: provider,
        model: model,
        suggestion_type: :model_deprecation,
        status: :pending_approval
      )

      suggestion.result = {
        found: true,
        source: provider,
        verify_url: VERIFY_URLS[provider],
        live_model_count: live_ids.size,
        checked_at: Time.current.iso8601
      }
      suggestion.save!
      suggestion.id
    end
  end
end
