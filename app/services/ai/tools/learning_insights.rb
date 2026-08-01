# frozen_string_literal: true

module Ai
  module Tools
    class LearningInsights < Base
      MINIMUM_CORRECTIONS = 50

      def self.tool_name = 'learning_insights'

      def self.description
        'Returns the real status of AI Self-Learning for this workspace: either progress ' \
          'toward the minimum corrections needed to generate a suggestion, or the pending/' \
          'already-applied suggestion itself (summary, suggested prompt addition, correction ' \
          'patterns, confidence). Use this for phrasing like "how is the AI learning", ' \
          '"is there a pending suggestion", or "how many corrections do we have". This tool ' \
          'never applies anything — use apply_learning_suggestion for that.'
      end

      def self.visible_to?(user)
        WorkspacePolicy.new(user, user.workspace).manage_learning?
      end

      def call(**_params)
        corrections = ClassificationCorrection.for_workspace(@workspace)
        suggestion  = @workspace.settings['learning_suggestion']

        ServiceResult.success(
          total_corrections: corrections.count,
          threshold: MINIMUM_CORRECTIONS,
          has_suggestion: suggestion.present?,
          suggestion: suggestion_summary(suggestion)
        )
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end

      private

      def suggestion_summary(suggestion)
        return nil if suggestion.blank?

        {
          summary: suggestion['summary'],
          suggested_prompt_addition: suggestion['suggested_prompt_addition'],
          correction_patterns: suggestion['correction_patterns'],
          confidence: suggestion['confidence'],
          generated_at: suggestion['generated_at'],
          applied: suggestion['applied_at'].present?
        }
      end
    end
  end
end
