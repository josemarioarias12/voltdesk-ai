# frozen_string_literal: true

module Settings
  class ApplyLearningSuggestion
    def self.call(workspace:)
      new(workspace: workspace).call
    end

    def initialize(workspace:)
      @workspace = workspace
    end

    def call
      suggestion = @workspace.settings['learning_suggestion']
      return ServiceResult.failure('No suggestion available.') if suggestion.blank?

      addition = suggestion['suggested_prompt_addition'].to_s
      @workspace.settings['custom_prompt_context'] =
        [@workspace.settings['custom_prompt_context'], addition].compact.join("\n\n")
      @workspace.settings['learning_suggestion']['applied_at'] = Time.current.iso8601
      @workspace.save!

      ServiceResult.success(@workspace)
    rescue StandardError => e
      Rails.logger.error("[Settings::ApplyLearningSuggestion] #{e.message}")
      ServiceResult.failure('An unexpected error occurred.')
    end
  end
end
