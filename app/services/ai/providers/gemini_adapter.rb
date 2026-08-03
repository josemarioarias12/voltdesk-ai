# frozen_string_literal: true

module Ai
  module Providers
    class GeminiAdapter
      SUPPORTED_MODELS = %w[gemini-2.0-flash gemini-1.5-pro].freeze
      EMBEDDING_MODEL  = 'text-embedding-004'
      EMBEDDING_DIMS   = 768

      def initialize
        @client = Gemini.new(
          credentials: {
            service: 'generative-language-api',
            api_key: ENV.fetch('GEMINI_API_KEY'),
            version: 'v1beta'
          },
          options: { model: 'gemini-2.0-flash', server_sent_events: false }
        )
      end

      # Returns { content: String, tokens: Hash }
      def chat(prompt:, system:, model: 'gemini-2.0-flash')
        @client = Gemini.new(
          credentials: {
            service: 'generative-language-api',
            api_key: ENV.fetch('GEMINI_API_KEY'),
            version: 'v1beta'
          },
          options: { model: model, server_sent_events: false }
        )

        response = @client.generate_content(
          { contents: [
            { role: 'user', parts: [{ text: "#{system}\n\n#{prompt}" }] }
          ] }
        )

        content = response.dig('candidates', 0, 'content', 'parts', 0, 'text').to_s
        usage   = response['usageMetadata'] || {}

        {
          content: content,
          tokens: {
            'prompt_tokens' => usage['promptTokenCount'] || 0,
            'completion_tokens' => usage['candidatesTokenCount'] || 0,
            'total_tokens' => usage['totalTokenCount'] || 0
          }
        }
      end

      # Gemini embeddings are 768-dim — not compatible with our 1536-dim pgvector index.
      # Always delegate embed() to OpenAI. This is by design, not a limitation.
      def embed(text:)
        raise NotImplementedError,
              'Gemini embeddings are 768-dim — incompatible with pgvector 1536 index. Use OpenAI adapter.'
      end

      def list_model_ids
        @client.models['models'].to_a.map { |m| m['name'].to_s.delete_prefix('models/') }
      end

      def provider_name = 'gemini'
      def embedding_model = nil
    end
  end
end
