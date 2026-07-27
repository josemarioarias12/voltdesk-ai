# frozen_string_literal: true

module Ai
  module Providers
    class OpenaiAdapter
      SUPPORTED_MODELS = %w[gpt-4o gpt-4o-mini gpt-4.1 gpt-4.1-mini gpt-5.2].freeze
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
        usage = response['usage'] || {}
        {
          content: content,
          tokens: {
            'prompt_tokens'     => usage['prompt_tokens'] || 0,
            'completion_tokens' => usage['completion_tokens'] || 0,
            'total_tokens'      => usage['total_tokens'] || 0
          }
        }
      end

      # messages: full conversation history, tool results included as
      # { role: 'tool', tool_call_id:, content: } entries by the caller.
      # tools: OpenAI function-calling schema, built by Ai::Tools::Registry.
      # Returns { content:, tool_calls: [{id:, name:, arguments:}], tokens:, stop_reason: :tool_use|:end_turn }
      def chat_with_tools(messages:, tools:, system:, model: 'gpt-4o')
        response = @client.chat(
          parameters: {
            model:       model,
            temperature: 0.2,
            max_tokens:  800,
            messages:    [{ role: 'system', content: system }] + messages,
            tools:       tools,
            tool_choice: 'auto'
          }
        )

        message       = response.dig('choices', 0, 'message') || {}
        finish_reason = response.dig('choices', 0, 'finish_reason')
        usage         = response['usage'] || {}

        {
          content: message['content'],
          tool_calls: parse_tool_calls(message['tool_calls']),
          tokens: {
            'prompt_tokens'     => usage['prompt_tokens'] || 0,
            'completion_tokens' => usage['completion_tokens'] || 0,
            'total_tokens'      => usage['total_tokens'] || 0
          },
          stop_reason: finish_reason == 'tool_calls' ? :tool_use : :end_turn
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

      private

      def parse_tool_calls(raw_tool_calls)
        (raw_tool_calls || []).map do |tc|
          {
            id: tc['id'],
            name: tc.dig('function', 'name'),
            arguments: parse_arguments(tc.dig('function', 'arguments'))
          }
        end
      end

      def parse_arguments(raw_json)
        JSON.parse(raw_json.to_s)
      rescue JSON::ParserError => e
        Rails.logger.error("[OpenaiAdapter] Failed to parse tool arguments: #{e.message}")
        {}
      end
    end
  end
end
