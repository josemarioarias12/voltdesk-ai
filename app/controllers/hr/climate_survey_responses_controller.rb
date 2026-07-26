# frozen_string_literal: true

module Hr
  class ClimateSurveyResponsesController < ApplicationController
    def new
      survey = find_respondable_survey
      return redirect_to(hr_root_path, alert: t('hr.climate_surveys.none_available')) unless survey

      authorize survey, :respond?
      render inertia: 'HR/ClimateSurveys/Respond', props: {
        survey: { id: survey.id, title: survey.title, description: survey.description }
      }
    end

    def create
      survey = ClimateSurvey.find(params.expect(:climate_survey_id))
      authorize survey, :respond?

      result = Hr::SubmitClimateSurveyResponse.call(survey: survey, user: current_user, params: response_params)
      if result.success?
        redirect_to hr_root_path, notice: t('hr.climate_surveys.response_submitted')
      else
        redirect_back_or_to(new_hr_climate_survey_response_path(climate_survey_id: survey.id), alert: result.error)
      end
    end

    private

    def find_respondable_survey
      requested_id = params[:climate_survey_id]
      return ClimateSurvey.available_for(current_user).find_by(id: requested_id) if requested_id

      ClimateSurvey.available_for(current_user).first
    end

    def response_params
      params.expect(climate_survey_response: %i[rating recommend_score feedback])
    end
  end
end
