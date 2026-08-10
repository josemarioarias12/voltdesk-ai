# frozen_string_literal: true

module Ai
  class SpaceOptimizer
    include AiAuditable

    ANALYSIS_DAYS = 90

    def initialize(workspace:, requested_by:)
      @workspace = workspace
      @user = requested_by
    end

    def call
      utilization_result = Facilities::SpaceUtilization.new(
        workspace: @workspace,
        period_start: ANALYSIS_DAYS.days.ago,
        period_end: Time.current
      ).call

      return ServiceResult.failure('Could not compute utilization') unless utilization_result.success?

      utilization_data = utilization_result.data
      prompt = build_prompt(utilization_data)

      response = with_ai_audit(
        operation: :space_optimization,
        model: 'gpt-4o',
        provider: 'openai'
      ) do |ctx|
        adapter, model, _provider = Ai::ModelRouter.for(
          workspace: @workspace,
          operation: :space_optimization
        ).resolve

        result = adapter.chat(
          prompt: prompt,
          system: system_prompt,
          model: model,
          max_tokens: 1800
        )
        ctx[:prompt] = prompt
        ctx[:response] = result[:content]
        ctx[:tokens] = result[:tokens]
        ctx[:confidence] = 0.85
        result[:content]
      end

      recommendations = parse_recommendations(response)
      ServiceResult.success(
        recommendations: recommendations,
        analyzed_spaces: utilization_data.count,
        period_days: ANALYSIS_DAYS,
        generated_at: Time.current.iso8601
      )
    rescue StandardError => e
      ServiceResult.failure("Space optimization failed: #{e.message}")
    end

    private

    def build_prompt(utilization_data)
      summary = utilization_data.map do |space|
        "- #{space[:space_name]} (#{space[:space_type]}, capacity: #{space[:capacity]}): " \
          "#{space[:utilization_percentage]}% utilization, " \
          "#{space[:total_reservations]} reservations in #{ANALYSIS_DAYS} days, " \
          "status: #{space[:status]}"
      end.join("\n")

      <<~PROMPT
        Analyze the following space utilization data for the last #{ANALYSIS_DAYS} days
        and provide optimization recommendations:

        #{summary}

        Provide specific, actionable recommendations including:
        1. Underutilized spaces and suggested repurposing
        2. Overdemanded spaces and solutions to increase capacity
        3. Suggested redistribution with estimated impact percentages
        4. Quick wins that can be implemented immediately
      PROMPT
    end

    def system_prompt
      <<~SYSTEM
        You are a workplace optimization expert analyzing office space utilization data.
        Respond in JSON format with this exact structure:
        {
          "summary": "executive summary in 2 sentences",
          "underutilized": [{"space": "name", "current_utilization": "X%", "recommendation": "action", "estimated_impact": "description"}],
          "overdemanded": [{"space": "name", "current_utilization": "X%", "recommendation": "action", "estimated_impact": "description"}],
          "quick_wins": ["action 1", "action 2"],
          "projected_improvement": "overall impact description"
        }
        Be specific with numbers and percentages. Base all recommendations on the actual data provided.
      SYSTEM
    end

    def parse_recommendations(response)
      clean = response.gsub(/```json|```/, '').strip
      JSON.parse(clean, symbolize_names: true)
    rescue JSON::ParserError
      { summary: response, underutilized: [], overdemanded: [], quick_wins: [] }
    end
  end
end
