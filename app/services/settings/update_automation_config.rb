# frozen_string_literal: true

module Settings
  class UpdateAutomationConfig
    VALID_CATEGORIES = Ticket.categories.keys.freeze

    def self.call(workspace:, params:)
      new(workspace: workspace, params: params).call
    end

    def initialize(workspace:, params:)
      @workspace = workspace
      @params    = params
    end

    def call
      urgency_threshold    = @params[:agent_urgency_threshold].to_f
      similarity_threshold = @params[:agent_similarity_threshold].to_f
      human_in_the_loop    = ActiveModel::Type::Boolean.new.cast(@params[:human_in_the_loop])
      categories           = Array(@params[:automatable_categories]).map(&:to_s)

      unless (0.0..100.0).cover?(urgency_threshold)
        return ServiceResult.failure('Urgency threshold must be between 0 and 100')
      end

      unless (0.0..1.0).cover?(similarity_threshold)
        return ServiceResult.failure('Similarity threshold must be between 0 and 1')
      end

      invalid_categories = categories - VALID_CATEGORIES
      return ServiceResult.failure("Invalid categories: #{invalid_categories.join(', ')}") if invalid_categories.any?

      @workspace.update!(
        settings: @workspace.settings.merge(
          'agent_urgency_threshold'    => urgency_threshold,
          'agent_similarity_threshold' => similarity_threshold,
          'human_in_the_loop'          => human_in_the_loop,
          'automatable_categories'     => categories
        )
      )

      ServiceResult.success(@workspace)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end
  end
end
