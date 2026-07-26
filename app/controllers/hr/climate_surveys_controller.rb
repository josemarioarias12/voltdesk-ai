# frozen_string_literal: true

module Hr
  class ClimateSurveysController < ApplicationController
    before_action :set_survey, only: %i[show close]

    def index
      authorize :climate_survey, :index?
      surveys = policy_scope(ClimateSurvey).includes(:department, :created_by).recent
      render inertia: 'HR/ClimateSurveys/Index', props: {
        surveys: surveys.map { |s| serialize_survey_summary(s) }
      }
    end

    def show
      authorize @survey
      render inertia: 'HR/ClimateSurveys/Show', props: {
        survey: serialize_survey_detail(@survey)
      }
    end

    def new
      authorize :climate_survey, :create?
      render inertia: 'HR/ClimateSurveys/New', props: {
        departments: current_workspace.departments.ordered.map { |d| { id: d.id, name: d.name } }
      }
    end

    def create
      authorize :climate_survey, :create?
      result = Hr::CreateClimateSurvey.call(workspace: current_workspace, created_by: current_user,
                                            params: survey_params)
      if result.success?
        redirect_to hr_climate_survey_path(result.data), notice: t('hr.climate_surveys.created')
      else
        redirect_back_or_to(new_hr_climate_survey_path, alert: result.error)
      end
    end

    def close
      authorize @survey, :close?
      result = Hr::CloseClimateSurvey.call(survey: @survey)
      if result.success?
        redirect_to hr_climate_survey_path(@survey), notice: t('hr.climate_surveys.closed')
      else
        redirect_back_or_to(hr_climate_survey_path(@survey), alert: result.error)
      end
    end

    private

    def set_survey
      @survey = policy_scope(ClimateSurvey).find(params.expect(:id))
    end

    def survey_params
      params.expect(climate_survey: %i[title description department_id closes_at])
    end

    def serialize_survey_summary(survey)
      {
        id: survey.id,
        title: survey.title,
        status: survey.status,
        department: survey.department&.name,
        created_by: survey.created_by.full_name,
        participation_count: survey.participation_count,
        eligible_count: survey.eligible_count,
        created_at: survey.created_at.iso8601,
        closes_at: survey.closes_at&.iso8601
      }
    end

    def serialize_survey_detail(survey)
      serialize_survey_summary(survey).merge(
        description: survey.description,
        can_close: policy(survey).close?,
        ai_themes: survey.ai_themes,
        average_rating: average_metric(survey, :rating),
        average_recommend_score: average_metric(survey, :recommend_score)
      )
    end

    def average_metric(survey, column)
      survey.climate_survey_responses.average(column)&.to_f&.round(2)
    end
  end
end
