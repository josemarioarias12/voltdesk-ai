# frozen_string_literal: true

module Hr
  class AnalyzeSurveyThemesJob < ApplicationJob
    queue_as :ai_processing

    def perform(survey_id)
      survey = ClimateSurvey.find_by(id: survey_id)
      return unless survey

      result = Hr::AnalyzeSurveyThemes.call(survey: survey)

      return unless result.failure?

      Rails.logger.error("AnalyzeSurveyThemesJob failed for survey #{survey_id}: #{result.error}")
    end
  end
end
