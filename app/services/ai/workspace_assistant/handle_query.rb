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
        @pending_resource_link = nil
        @audit_log_ids = []
        @tool_rounds = []
      end

      def call
        @conversation.assistant_messages.create!(role: :user, content: @message)

        adapter, model, provider = Ai::ModelRouter.for(workspace: @workspace,
                                                       operation: :workspace_assistant_query).resolve
        tools_schema = Ai::Tools::Registry.schema_for(@user, provider: provider)
        history = build_history_messages(provider)
        tools_used = []

        hops = 0
        loop do
          hops += 1
          raise "Exceeded #{MAX_TOOL_HOPS} tool hops for a single query" if hops > MAX_TOOL_HOPS

          response = run_turn(adapter: adapter, model: model, provider: provider, history: history,
                              tools_schema: tools_schema)

          return finalize(response[:content].to_s, tools_used) if response[:stop_reason] == :end_turn

          tool_calls = response[:tool_calls]
          tool_results = tool_calls.map do |tool_call|
            tools_used << tool_call[:name]
            normalize_tool_result(execute_tool(tool_call))
          end
          @tool_rounds << { tool_calls: tool_calls, tool_results: tool_results }

          history = append_tool_round(history, provider, tool_calls, tool_results)
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
      ensure
        @audit_log_ids << last_ai_audit_log_id if last_ai_audit_log_id
      end

      def finalize(final_text, tools_used)
        message = @conversation.assistant_messages.create!(
          role: :assistant,
          content: final_text,
          metadata: { tools_used: tools_used, resource_link: @pending_resource_link,
                      tool_rounds: @tool_rounds }.compact
        )

        # rubocop:disable Rails/SkipsModelValidations -- linking an already-validated,
        # already-persisted log to its message; re-running full validations here is unnecessary
        AiAuditLog.where(id: @audit_log_ids).update_all(assistant_message_id: message.id) if @audit_log_ids.present?
        # rubocop:enable Rails/SkipsModelValidations

        attach_pending_report(message)

        ServiceResult.success(content: final_text, tools_used: tools_used,
                              has_attachment: message.report_file.attached?,
                              audit_log_ids: @audit_log_ids)
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
          When a report file is generated, tell the user briefly that it's ready for
          download — never describe its contents as if you had read the file yourself,
          and NEVER include a markdown link, file path, or made-up URL (e.g. "sandbox:/...")
          in your response. The application already shows a real download button separately;
          your text should never try to reproduce or simulate that link.
          Some tools (create_ticket, create_leave_request, create_reservation,
              apply_learning_suggestion, log_asset_maintenance) follow a
              two-step confirm-before-execute flow: their first response is a preview, never an
            executed action. Summarize that preview clearly and ask the user to confirm in their
            own words. Only call the same tool again with confirmed: true after they do — and
            reuse the exact parameters from the preview, never regenerate them from memory. Never
            set confirmed: true on your own initiative.
            When summarizing any preview, always use this structure regardless of
            which tool produced it: one intro sentence, then every field from the
            tool's summary as a bullet list with humanized labels (never raw
            snake_case keys like start_date), then a single yes/no confirmation
            question as the last line. Keep this skeleton identical across
            create_ticket, create_leave_request, and apply_learning_suggestion —
            only the wording and language should adapt, never the structure.
            IMPORTANT: when creating a ticket, ask ONLY for title and description. Do NOT ask
              about category or priority under any circumstances — they are handled automatically.
              Only ask about department if the tool explicitly reports that department_id is required.
              When creating a reservation, do NOT ask about attendees_count unless the user's
              message already implies a group size (e.g. "for the team", "with 5 people"). It
              defaults to 1 — the preview will show it clearly, and the user can correct it there
              if it's wrong. Never block the preview step by asking for it upfront.
            If the user asks you to fill in or generate the title and description yourself, or
            only gives a vague topic, write a reasonable title and description from whatever
            context you have — do not ask again, and never present an example for them to copy.
            CRITICAL: after calling create_ticket, create_leave_request, create_reservation, or log_asset_maintenance,
              check the tool result. If it contains preview: true, NOTHING was created yet — you
              MUST summarize it as a preview and ask for confirmation, never say it was created.
              Only say something was created if the tool result contains resource_link — that is
              the only reliable signal that a real record was persisted. Never claim success
              without it.
              CRITICAL — this applies to every tool call, not just the ones named above: never
              write a preview, summary, or confirmation message from memory. Every number, name,
              date, or detail you present as a preview must come from that tool's actual return
              value in THIS turn — never something you composed yourself, and never something
              copied from an earlier turn's preview. If the user asks to confirm something and you
              have not yet called the relevant tool with confirmed: true in this exchange, call it
              now before responding — do not describe an action as done, or as pending
              confirmation, without a real tool call backing that exact statement.
            Reply in the same language the user just wrote in. Default to #{@locale} only when
            their message gives no clear signal either way.
            Today's date is #{Time.zone.today.iso8601}. Use this as the only source of truth for
            any relative date the user gives you (today, tomorrow, next week, etc.) — never infer
            the current date from anything else.
            CRITICAL: after calling apply_learning_suggestion, check the tool result. If it
            contains already_applied: true, tell the user this was already applied earlier — do
            not say you just applied it. Only say it was applied just now if the result contains
            applied: true.
            After calling explain_decision, check audit_trail_found. If it is false, explain the
            decision using only category, priority, urgency_score, and reasoning — never mention
            or invent cost, tokens, duration, or a classification timestamp, since none were found.
            For cross_module_insight, a short example the user might say is "Which department
            needs help?" — call this tool for that phrasing or similar cross-department health
            questions, and lead your answer with department_needing_most_help before listing the
            rest. If cross_module_insight is not in your tool list for this user and they ask a
            similar cross-department question, do not silently answer from ticket data alone as
            if it were the same analysis — tell them explicitly that this answer is based on
            ticket volume only, since the full cross-department view (including asset risk) needs
            elevated permissions.
        PROMPT
      end

      def build_history_messages(provider)
        @conversation.assistant_messages.order(:created_at).reduce([]) do |acc, m|
          next acc + [{ role: 'user', content: m.content }] if m.role_user?

          with_rounds = Array(m.metadata['tool_rounds']).reduce(acc) do |history, round|
            tool_calls = round['tool_calls'].map(&:deep_symbolize_keys)
            tool_results = round['tool_results'].map(&:deep_symbolize_keys)
            append_tool_round(history, provider, tool_calls, tool_results)
          end

          with_rounds + [{ role: 'assistant', content: m.content }]
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

        extract_resource_link(result)
        extract_attachment(result)
      end

      def extract_resource_link(result)
        return unless result.success? && result.data.is_a?(Hash) && result.data[:resource_link]

        @pending_resource_link = result.data[:resource_link]
      end

      # File attachments and full AR records (ticket, leave_request) never travel back
      # into the conversation history — only a stripped summary does. Binary data is
      # tracked separately and attached directly to the final AssistantMessage once the
      # loop ends; resource_link is captured separately too, for the frontend card.
      def extract_attachment(result)
        return result unless result.success? && result.data.is_a?(Hash)

        attachment = result.data[:attachment]
        @pending_attachments << attachment if attachment

        stripped = result.data.except(:attachment, :ticket, :leave_request, :asset)
        ServiceResult.success(stripped)
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

      def normalize_tool_result(result)
        return { success: true, data: result.data } if result.success?

        { success: false, error: result.error }
      end

      def serialize_tool_result(normalized)
        return normalized[:data].to_json if normalized[:success]

        { error: normalized[:error] }.to_json
      end
    end
  end
end
