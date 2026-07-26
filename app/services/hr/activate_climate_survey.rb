# frozen_string_literal: true

module Hr
  class ActivateClimateSurvey
    def self.call(**args) = new(**args).call

    def initialize(survey:)
      @survey = survey
    end

    def call
      return ServiceResult.failure('Only draft surveys can be activated') unless @survey.draft?

      @survey.update!(status: :active)
      ServiceResult.success(@survey)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end
  end
end
