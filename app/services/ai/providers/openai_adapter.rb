# frozen_string_literal: true

module Ai
  module Providers
    class OpenaiAdapter
      SUPPORTED_MODELS = %w[gpt-4o gpt-4o-mini gpt-4.1 gpt-4.1-mini].freeze
      EMBEDDING_MODEL  = 'text-embedding-3-large'
      EMBEDDING_DIMS   = 1536

      def initialize
        @client = OpenAI::Client.new
      end

      # Returns { content: String, tokens: Hash }
      def chat(prompt:, system:, model: 'gpt-4o', messages: nil)
        user_messages = messages || [{ role: 'user', content: prompt }]
        response = @client.chat(
          parameters: {
            model:       model,
            temperature: 0.2,
            max_tokens:  500,
            messages:    [{ role: 'system', content: system }] + user_messages
          }
        )
        content = response.dig('choices', 0, 'message', 'content').to_s
        usage   = response['usage'] || {}
        {
          content: content,
          tokens: {
            'prompt_tokens'       => usage['prompt_tokens'] || 0,
            'completion_tokens'   => usage['completion_tokens'] || 0,
            'total_tokens'        => usage['total_tokens'] || 0
          }
        }
      end

      # Returns { vector: Array<Float>, tokens: Hash }
      def embed(text:)
        response = @client.embeddings(
          parameters: {
            model: EMBEDDING_MODEL,
            input: text,
            dimensions: EMBEDDING_DIMS
          }
        )

        vector = response.dig('data', 0, 'embedding')
        usage  = response['usage'] || {}

        raise 'Empty embedding from OpenAI' if vector.blank?
        raise "Expected #{EMBEDDING_DIMS} dims, got #{vector.length}" if vector.length != EMBEDDING_DIMS

        {
          vector: vector,
          tokens: {
            'prompt_tokens' => usage['prompt_tokens'] || 0,
            'completion_tokens' => 0,
            'total_tokens' => usage['total_tokens'] || 0
          }
        }
      end

      def provider_name = 'openai'
      def embedding_model = EMBEDDING_MODEL
    end
  end
end
