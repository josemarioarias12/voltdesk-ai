# frozen_string_literal: true

module Ai
  module Providers
    class AnthropicAdapter
      SUPPORTED_MODELS = %w[claude-sonnet-4-6 claude-haiku-4-5].freeze

      def initialize
        @client = Anthropic::Client.new(access_token: ENV.fetch('ANTHROPIC_API_KEY'))
      end

      # Returns { content: String, tokens: Hash }
      def chat(prompt:, system:, model: 'claude-sonnet-4-6')
        response = @client.messages(
          parameters: {
            model: model,
            system: system,
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }]
          }
        )

        content = response.dig('content', 0, 'text').to_s
        usage   = response['usage'] || {}

        {
          content: content,
          tokens: {
            'prompt_tokens' => usage['input_tokens'] || 0,
            'completion_tokens' => usage['output_tokens'] || 0,
            'total_tokens' => (usage['input_tokens'] || 0) + (usage['output_tokens'] || 0)
          }
        }
      end

      def embed(text:)
        raise NotImplementedError, 'Anthropic does not provide embeddings. Use OpenAI adapter.'
      end

      def provider_name = 'anthropic'
      def embedding_model = nil
    end
  end
end
