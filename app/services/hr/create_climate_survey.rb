# frozen_string_literal: true

module Hr
  class CreateClimateSurvey
    def self.call(**args) = new(**args).call

    def initialize(workspace:, created_by:, params:)
      @workspace  = workspace
      @created_by = created_by
      @params     = params
    end

    def call
      survey = @workspace.climate_surveys.build(
        @params.merge(created_by: @created_by, status: :draft)
      )
      return ServiceResult.failure(survey.errors.full_messages.join(', ')) unless survey.save

      ServiceResult.success(survey)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end
  end
end
