# frozen_string_literal: true

module Hr
  class CloseClimateSurvey
    def self.call(**args) = new(**args).call

    def initialize(survey:)
      @survey = survey
    end

    def call
      return ServiceResult.failure('Survey is already closed') if @survey.closed?

      @survey.update!(status: :closed)
      Hr::AnalyzeSurveyThemesJob.perform_later(@survey.id)
      ServiceResult.success(@survey)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end
  end
end
