# frozen_string_literal: true

module Ai
  module Tools
    class ApplyLearningSuggestion < Base
      def self.tool_name = 'apply_learning_suggestion'

      def self.description
        'Applies the pending AI Self-Learning suggestion for this workspace, following a ' \
          'two-step confirm-before-execute flow. The first call (confirmed omitted or false) ' \
          'returns a preview of the suggestion WITHOUT applying it — summarize it for the user ' \
          'and ask them to confirm. Only call again with confirmed: true after explicit ' \
          'confirmation. If there is no pending suggestion, or it was already applied earlier, ' \
          'the tool reports that instead of applying anything again — never tell the user it ' \
          'was applied unless the result contains applied: true.'
      end

      def self.parameters_schema
        {
          type: 'object',
          properties: {
            confirmed: {
              type: 'boolean',
              description: 'Set to true only on the second call, after explicit user confirmation. Defaults to false.'
            }
          },
          required: []
        }
      end

      def self.visible_to?(user)
        WorkspacePolicy.new(user, user.workspace).manage_learning?
      end

      def call(confirmed: false)
        suggestion = @workspace.settings['learning_suggestion']
        return ServiceResult.failure('There is no pending learning suggestion for this workspace.') if suggestion.blank?

        return already_applied(suggestion) if suggestion['applied_at'].present?
        return execute if confirmed

        preview(suggestion)
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end

      private

      def already_applied(suggestion)
        ServiceResult.success(
          already_applied: true,
          applied_at: suggestion['applied_at'],
          message: 'This suggestion was already applied — nothing to do.'
        )
      end

      def preview(suggestion)
        ServiceResult.success(
          preview: true,
          summary: {
            summary: suggestion['summary'],
            suggested_prompt_addition: suggestion['suggested_prompt_addition'],
            confidence: suggestion['confidence'],
            correction_patterns: suggestion['correction_patterns']
          }
        )
      end

      def execute
        result = Settings::ApplyLearningSuggestion.call(workspace: @workspace)
        return result if result.failure?

        ServiceResult.success(
          applied: true,
          message: 'Learning suggestion applied successfully.',
          resource_link: {
            title: 'AI Self-Learning',
            path: '/settings/learning',
            icon: 'sparkles'
          }
        )
      end
    end
  end
end
