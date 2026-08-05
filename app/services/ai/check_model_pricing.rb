# frozen_string_literal: true

module Ai
  class CheckModelPricing
    OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'
    OPENROUTER_BASE_URL = 'https://openrouter.ai/models'
    PRICE_CHANGE_THRESHOLD = 0.01

    MODEL_ID_MAP = {
      'openai/gpt-4o' => 'openai/gpt-4o',
      'openai/gpt-4o-mini' => 'openai/gpt-4o-mini',
      'openai/gpt-4.1' => 'openai/gpt-4.1',
      'openai/gpt-4.1-mini' => 'openai/gpt-4.1-mini',
      'openai/gpt-5.2' => 'openai/gpt-5.2',
      'anthropic/claude-sonnet-5' => 'anthropic/claude-sonnet-5',
      'anthropic/claude-haiku-4-5-20251001' => 'anthropic/claude-haiku-4.5',
      'gemini/gemini-2.0-flash' => 'google/gemini-2.0-flash-001'
      # gemini-1.5-pro intentionally not mapped: model is being fully
      # discontinued by Google, mapping it would only add noise via
      # not_found_in_openrouter without any actionable value.
    }.freeze

    def self.call
      new.call
    end

    def call
      response = fetch_openrouter_models
      return ServiceResult.failure(response) unless response.is_a?(Hash)

      results = Ai::ModelRouter::PROVIDER_TOKEN_PRICING.keys.map { |key| check_model(key, response) }
      flagged = results.select { |r| r[:flagged] }

      ServiceResult.success(
        checked: results.size, flagged: flagged.size, suggestion_ids: flagged.pluck(:suggestion_id)
      )
    rescue StandardError => e
      Rails.logger.error("[Ai::CheckModelPricing] #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def fetch_openrouter_models
      uri = URI(OPENROUTER_MODELS_URL)
      response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 10) do |http|
        http.request(Net::HTTP::Get.new(uri))
      end
      return "HTTP #{response.code} from OpenRouter" unless response.is_a?(Net::HTTPSuccess)

      JSON.parse(response.body)
    rescue JSON::ParserError, Net::OpenTimeout, Net::ReadTimeout, SocketError => e
      e.message
    end

    def check_model(internal_key, openrouter_response)
      openrouter_id = MODEL_ID_MAP[internal_key]
      return skip(internal_key, 'no_mapping') unless openrouter_id

      entry = openrouter_response['data']&.find { |m| m['id'] == openrouter_id }
      return skip(internal_key, 'not_found_in_openrouter') unless entry

      fetched_input  = entry.dig('pricing', 'prompt')&.to_f
      fetched_output = entry.dig('pricing', 'completion')&.to_f
      return skip(internal_key, 'missing_pricing_fields') if fetched_input.nil? || fetched_output.nil?

      # OpenRouter prices per token; PROVIDER_TOKEN_PRICING is per 1K tokens.
      fetched_input_per_1k  = fetched_input * 1000
      fetched_output_per_1k = fetched_output * 1000
      current = Ai::ModelRouter::PROVIDER_TOKEN_PRICING[internal_key]

      changed = price_changed?(current[:input], fetched_input_per_1k) ||
                price_changed?(current[:output], fetched_output_per_1k)
      return { flagged: false } unless changed

      suggestion_id = upsert_suggestion(internal_key, openrouter_id, current, fetched_input_per_1k,
                                        fetched_output_per_1k)
      return { flagged: false } if suggestion_id.nil?

      { flagged: true, suggestion_id: suggestion_id }
    end

    def price_changed?(current, fetched)
      return true if current.nil? || fetched.nil?

      (current - fetched).abs / current > PRICE_CHANGE_THRESHOLD
    end

    def skip(internal_key, reason)
      Rails.logger.info("[Ai::CheckModelPricing] #{internal_key}: not verified (#{reason})")
      { flagged: false }
    end

    def upsert_suggestion(internal_key, openrouter_id, current, fetched_input, fetched_output)
      provider, model = internal_key.split('/', 2)

      decided = Ai::ModelGovernanceSuggestion.most_recent_decided(provider, model, :pricing_update)
      if decided && already_reported?(decided, fetched_input, fetched_output)
        Rails.logger.info(
          "[Ai::CheckModelPricing] #{internal_key}: change already reviewed (status: #{decided.status})"
        )
        return nil
      end

      suggestion = Ai::ModelGovernanceSuggestion.find_or_initialize_by(
        provider: provider,
        model: model,
        suggestion_type: :pricing_update,
        status: :pending_approval
      )

      suggestion.result = {
        found: true,
        source: 'openrouter',
        verify_url: verify_url_for(openrouter_id),
        current_input: current[:input],
        current_output: current[:output],
        fetched_input: fetched_input,
        fetched_output: fetched_output,
        checked_at: Time.current.iso8601
      }
      suggestion.save!
      suggestion.id
    end

    def already_reported?(decided, fetched_input, fetched_output)
      decided.result['fetched_input'] == fetched_input && decided.result['fetched_output'] == fetched_output
    end

    def verify_url_for(openrouter_id)
      deep_link = "https://openrouter.ai/#{openrouter_id}"
      return deep_link if Ai::UrlReachabilityChecker.reachable?(deep_link)

      Rails.logger.warn("[Ai::CheckModelPricing] verify_url unreachable, falling back to base: #{deep_link}")
      OPENROUTER_BASE_URL
    end
  end
end
