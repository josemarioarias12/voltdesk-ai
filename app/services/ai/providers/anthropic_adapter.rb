# frozen_string_literal: true

module Ai
  module Providers
    class AnthropicAdapter
      SUPPORTED_MODELS = %w[claude-sonnet-5 claude-haiku-4-5-20251001].freeze

      def initialize
        @client = Anthropic::Client.new(access_token: ENV.fetch('ANTHROPIC_API_KEY'))
      end

      # Returns { content: String, tokens: Hash }
      def chat(prompt:, system:, model: 'claude-sonnet-5')
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

      # messages: full conversation history, tool results included as
      # { role: 'user', content: [{ type: 'tool_result', tool_use_id:, content: }] } by the caller.
      # tools: Anthropic tool schema (flat, no function wrapper), built by Ai::Tools::Registry.
      # Returns { content:, tool_calls: [{id:, name:, arguments:}], tokens:, stop_reason: :tool_use|:end_turn }
      def chat_with_tools(messages:, tools:, system:, model: 'claude-sonnet-5')
        response = @client.messages(
          parameters: {
            model: model,
            system: system,
            max_tokens: 800,
            messages: messages,
            tools: tools
          }
        )

        blocks     = response['content'] || []
        text_block = blocks.find { |b| b['type'] == 'text' }
        tool_calls = blocks.select { |b| b['type'] == 'tool_use' }.map do |b|
          { id: b['id'], name: b['name'], arguments: b['input'] || {} }
        end
        usage = response['usage'] || {}

        {
          content: text_block&.dig('text'),
          tool_calls: tool_calls,
          tokens: {
            'prompt_tokens' => usage['input_tokens'] || 0,
            'completion_tokens' => usage['output_tokens'] || 0,
            'total_tokens' => (usage['input_tokens'] || 0) + (usage['output_tokens'] || 0)
          },
          stop_reason: response['stop_reason'] == 'tool_use' ? :tool_use : :end_turn
        }
      end

      def embed(text:)
        raise NotImplementedError, 'Anthropic does not provide embeddings. Use OpenAI adapter.'
      end

      def list_model_ids
        uri = URI('https://api.anthropic.com/v1/models')
        request = Net::HTTP::Get.new(uri)
        request['x-api-key']         = ENV.fetch('ANTHROPIC_API_KEY')
        request['anthropic-version'] = '2023-06-01'

        response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 10) do |http|
          http.request(request)
        end
        return [] unless response.is_a?(Net::HTTPSuccess)

        JSON.parse(response.body)['data'].to_a.pluck('id')
      end

      def provider_name = 'anthropic'
      def embedding_model = nil
    end
  end
end
