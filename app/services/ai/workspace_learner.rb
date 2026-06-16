# frozen_string_literal: true

module Ai
  class WorkspaceLearner
    include AiAuditable

    MINIMUM_CORRECTIONS = 50
    SYSTEM_PROMPT = <<~PROMPT
      You are an AI classification analyst. Analyze correction patterns and return ONLY valid JSON with no markdown, no backticks, no preamble.
      Return this exact structure:
      {
        "summary": "string describing the main patterns found",
        "suggested_prompt_addition": "string with concrete examples to add to the classification prompt",
        "correction_patterns": [{"from": "string", "to": "string", "count": integer, "pct": float}],
        "confidence": float between 0 and 1
      }
    PROMPT

    def self.call(workspace:)
      new(workspace).call
    end

    def initialize(workspace)
      @workspace = workspace
    end

    def call
      corrections = ClassificationCorrection.for_workspace(@workspace).recent(100)
      return ServiceResult.failure('insufficient_data') if corrections.count < MINIMUM_CORRECTIONS

      patterns = build_patterns(corrections)
      prompt   = build_prompt(patterns, corrections.count)

      adapter, model, provider = Ai::ModelRouter.for(workspace: @workspace, operation: :analysis).resolve

      response = with_ai_audit(operation: :analysis, model: model, provider: provider) do |ctx|
        result = adapter.chat(prompt: prompt, system: SYSTEM_PROMPT, model: model)
        ctx[:confidence] = 0.8
        ctx[:prompt]     = prompt
        ctx[:response]   = result
        result
      end

      parsed = JSON.parse(response.gsub(/```json|```/, '').strip)

      @workspace.settings['learning_suggestion'] = parsed.merge(
        'generated_at'             => Time.current.iso8601,
        'corrections_before_apply' => corrections.count
      )
      @workspace.save!

      broadcast_suggestion(corrections.count)

      ServiceResult.success(parsed)
    rescue JSON::ParserError
      ServiceResult.failure('invalid_ai_response')
    rescue StandardError => e
      Rails.logger.error("[Ai::WorkspaceLearner] #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def build_patterns(corrections)
      corrections
        .group_by { |cor| [cor.original_category, cor.corrected_category] }
        .transform_values(&:count)
        .sort_by { |_, cnt| -cnt }
    end

    def build_prompt(patterns, total)
      lines = patterns.map do |(from, to), count|
        pct = (count.to_f / total * 100).round(1)
        "- Category '#{from}' was corrected to '#{to}' #{count} times (#{pct}%)"
      end

      <<~PROMPT
        Analyze these AI classification correction patterns from workspace '#{@workspace.name}':

        #{lines.join("\n")}

        Total corrections analyzed: #{total}

        Based on these patterns, suggest a prompt addition that would help the AI classify tickets more accurately.
      PROMPT
    end

    def broadcast_suggestion(correction_count)
      ActionCable.server.broadcast(
        "workspace_admin:#{@workspace.id}",
        {
          event:   'learning_suggestion_ready',
          message: "New suggestion available — system detected patterns in #{correction_count} corrections"
        }
      )
    rescue StandardError => e
      Rails.logger.error("[Ai::WorkspaceLearner] broadcast failed: #{e.message}")
    end
  end
end
