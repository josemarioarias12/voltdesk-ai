# frozen_string_literal: true

module Ai
  module WorkspaceAssistant
    class HandleQuery
      include AiAuditable

      MAX_TOOL_HOPS = 4

      def self.call(conversation:, user:, workspace:, message:, locale:)
        new(conversation: conversation, user: user, workspace: workspace, message: message, locale: locale).call
      end

      def initialize(conversation:, user:, workspace:, message:, locale:)
        @conversation = conversation
        @user = user
        @workspace = workspace
        @message = message
        @locale = locale
        @pending_attachments = []
      end

      def call
        @conversation.assistant_messages.create!(role: :user, content: @message)

        adapter, model, provider = Ai::ModelRouter.for(workspace: @workspace,
                                                       operation: :workspace_assistant_query).resolve
        tools_schema = Ai::Tools::Registry.schema_for(@user, provider: provider)
        history = build_history_messages
        tools_used = []

        hops = 0
        loop do
          hops += 1
          raise "Exceeded #{MAX_TOOL_HOPS} tool hops for a single query" if hops > MAX_TOOL_HOPS

          response = run_turn(adapter: adapter, model: model, provider: provider, history: history,
                              tools_schema: tools_schema)

          return finalize(response[:content].to_s, tools_used) if response[:stop_reason] == :end_turn

          tool_results = response[:tool_calls].map do |tool_call|
            tools_used << tool_call[:name]
            execute_tool(tool_call)
          end

          history = append_tool_round(history, provider, response[:tool_calls], tool_results)
        end
      rescue StandardError => e
        Rails.logger.error("[Ai::WorkspaceAssistant::HandleQuery] #{e.class} — #{e.message}")
        ServiceResult.failure(e.message)
      end

      private

      def run_turn(adapter:, model:, provider:, history:, tools_schema:)
        with_ai_audit(operation: :workspace_assistant_query, model: model, provider: provider) do |ctx|
          ctx[:prompt] = history.to_json

          result = adapter.chat_with_tools(
            messages: history,
            tools: tools_schema,
            system: system_prompt,
            model: model
          )

          ctx[:response] = result[:content].presence || result[:tool_calls].to_json
          ctx[:tokens] = result[:tokens]
          ctx[:metadata] = { tool_calls: result[:tool_calls].pluck(:name) }

          result
        end
      end

      def finalize(final_text, tools_used)
        message = @conversation.assistant_messages.create!(
          role: :assistant,
          content: final_text,
          metadata: { tools_used: tools_used }
        )

        attach_pending_report(message)

        ServiceResult.success(content: final_text, tools_used: tools_used,
                              has_attachment: message.report_file.attached?)
      end

      def attach_pending_report(message)
        attachment = @pending_attachments.last
        return unless attachment

        message.report_file.attach(
          io: StringIO.new(attachment[:data]),
          filename: attachment[:filename],
          content_type: attachment[:content_type]
        )
      end

      def system_prompt
        <<~PROMPT
          You are Volt Copilot, the workspace assistant for VoltDesk AI.
          You answer questions about the user's workspace data by calling the tools available to you.
          Never answer from memory or general knowledge about the workspace — always call a tool to get real data.
          If no tool can answer the question, say so explicitly instead of guessing.
          When a report file is generated, tell the user it's ready for download — never
          describe its contents as if you had read the file yourself.
          Always respond in this language: #{@locale}.
        PROMPT
      end

      def build_history_messages
        @conversation.assistant_messages.order(:created_at).map do |m|
          { role: m.role, content: m.content }
        end
      end

      def execute_tool(tool_call)
        tool_class = Ai::Tools::Registry.find(tool_call[:name])
        return ServiceResult.failure("Unknown tool: #{tool_call[:name]}") unless tool_class
        unless tool_class.visible_to?(@user)
          return ServiceResult.failure("Tool not available for this user: #{tool_call[:name]}")
        end

        result = tool_class.new(user: @user, workspace: @workspace, locale: @locale)
                           .call(**tool_call[:arguments].symbolize_keys)

        extract_attachment(result)
      end

      # File attachments never travel back into the conversation history — only a
      # stripped summary does. The binary data is tracked separately and attached
      # directly to the final AssistantMessage once the loop ends.
      def extract_attachment(result)
        return result unless result.success? && result.data.is_a?(Hash) && result.data[:attachment]

        @pending_attachments << result.data[:attachment]
        ServiceResult.success(result.data.except(:attachment))
      end

      def append_tool_round(history, provider, tool_calls, tool_results)
        if provider == 'anthropic'
          append_anthropic_round(history, tool_calls, tool_results)
        else
          append_openai_round(history, tool_calls, tool_results)
        end
      end

      def append_openai_round(history, tool_calls, tool_results)
        assistant_message = {
          role: 'assistant',
          content: nil,
          tool_calls: tool_calls.map do |tc|
            { id: tc[:id], type: 'function', function: { name: tc[:name], arguments: tc[:arguments].to_json } }
          end
        }
        tool_messages = tool_calls.zip(tool_results).map do |tc, result|
          { role: 'tool', tool_call_id: tc[:id], content: serialize_tool_result(result) }
        end

        history + [assistant_message] + tool_messages
      end

      def append_anthropic_round(history, tool_calls, tool_results)
        assistant_message = {
          role: 'assistant',
          content: tool_calls.map { |tc| { type: 'tool_use', id: tc[:id], name: tc[:name], input: tc[:arguments] } }
        }
        user_message = {
          role: 'user',
          content: tool_calls.zip(tool_results).map do |tc, result|
            { type: 'tool_result', tool_use_id: tc[:id], content: serialize_tool_result(result) }
          end
        }

        history + [assistant_message, user_message]
      end

      def serialize_tool_result(result)
        return result.data.to_json if result.success?

        { error: result.error }.to_json
      end
    end
  end
end
