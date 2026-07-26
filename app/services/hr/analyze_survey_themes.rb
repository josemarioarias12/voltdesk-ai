# frozen_string_literal: true

module Hr
  class AnalyzeSurveyThemes
    include AiAuditable

    MIN_RESPONSES_FOR_ANALYSIS = 3

    def self.call(**args) = new(**args).call

    def initialize(survey:)
      @survey    = survey
      @workspace = survey.workspace
    end

    def call
      return ServiceResult.success(@survey) if responses_with_feedback.count < MIN_RESPONSES_FOR_ANALYSIS

      themes = with_ai_audit(operation: 'survey_analysis', model: model_used, provider: provider_used) do |ctx|
        prompt = build_prompt
        ctx[:prompt] = prompt

        response = adapter.chat(prompt: prompt, system: system_prompt, model: model_used)
        ctx[:response] = response[:content]
        ctx[:tokens]   = response[:usage]

        parse_themes(response[:content])
      end

      @survey.update!(ai_themes: themes)
      populate_sentiment_scores(themes)
      ServiceResult.success(@survey)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def responses_with_feedback
      @responses_with_feedback ||= @survey.climate_survey_responses.where.not(feedback: [nil, ''])
    end

    def router
      @router ||= Ai::ModelRouter.for(workspace: @workspace, operation: :climate_survey_analysis)
    end

    def adapter = router_result[0]
    def model_used = router_result[1]
    def provider_used  = router_result[2]
    def router_result  = @router_result ||= router.resolve

    def system_prompt
      <<~PROMPT
        You are an HR analyst identifying themes in employee climate survey feedback.
        Always respond with valid JSON only. No markdown, no explanation.
        Return exactly this structure:
        {
          "themes": [
            {
              "theme": "Short theme name",
              "sentiment": "positive" | "negative" | "mixed",
              "mentions": 5,
              "example_quote": "A representative anonymized quote, rephrased to remove identifying details"
            }
          ]
        }
        Identify 3-6 themes. Never include employee names or identifying details in quotes.
      PROMPT
    end

    def build_prompt
      feedback_list = responses_with_feedback.pluck(:feedback).map { |f| "- #{f}" }.join("\n")

      <<~PROMPT
        Analyze the following anonymous employee feedback from a climate survey and identify
        the main recurring themes, their overall sentiment, and how many responses mention each.

        Feedback:
        #{feedback_list}
      PROMPT
    end

    def parse_themes(content)
      data = JSON.parse(content)
      data['themes'].map do |theme|
        {
          'theme' => theme['theme'],
          'sentiment' => theme['sentiment'],
          'mentions' => theme['mentions'],
          'example_quote' => theme['example_quote']
        }
      end
    rescue JSON::ParserError => e
      raise "Invalid AI response format: #{e.message}"
    end

    def populate_sentiment_scores(themes)
      overall_sentiment = derive_overall_sentiment(themes)
      # sentiment_score has no model validations, and this can touch many rows at once —
      # a bulk update is intentional here, not an oversight.
      responses_with_feedback.update_all(sentiment_score: overall_sentiment) # rubocop:disable Rails/SkipsModelValidations
    end

    def derive_overall_sentiment(themes)
      return 0.0 if themes.empty?

      scores = themes.map do |t|
        case t['sentiment']
        when 'positive' then 1.0
        when 'negative' then -1.0
        else 0.0
        end
      end
      (scores.sum / scores.size).round(3)
    end
  end
end
