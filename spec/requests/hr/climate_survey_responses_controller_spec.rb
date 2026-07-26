# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::ClimateSurveyResponsesController, type: :request do
  let(:workspace)  { create(:workspace) }
  let(:hr_manager) { create(:user, workspace: workspace, role: :hr_manager) }
  let(:employee)   { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /hr/climate_survey_responses/new' do
    before { sign_in employee }

    context 'when there is an available survey' do
      let!(:survey) { create(:climate_survey, :active, workspace: workspace, created_by: hr_manager) }

      it 'returns 200 with the survey' do
        get new_hr_climate_survey_response_path, headers: inertia_headers
        json = response.parsed_body
        expect(json['props']['survey']['id']).to eq(survey.id)
      end
    end

    context 'when there is no available survey' do
      it 'redirects with a message' do
        get new_hr_climate_survey_response_path
        expect(response).to redirect_to(hr_root_path)
      end
    end
  end

  describe 'POST /hr/climate_survey_responses' do
    let(:survey) { create(:climate_survey, :active, workspace: workspace, created_by: hr_manager) }

    before { sign_in employee }

    it 'creates a response anonymously (no user data leaked in the redirect)' do
      expect do
        post hr_climate_survey_responses_path, params: {
          climate_survey_id: survey.id,
          climate_survey_response: { rating: 5, recommend_score: 5, feedback: 'Great place to work.' }
        }
      end.to change(ClimateSurveyResponse, :count).by(1)

      expect(ClimateSurveyResponse.last.user).to eq(employee)
      expect(response).to redirect_to(hr_root_path)
    end

    it 'returns failure when the user already responded' do
      create(:climate_survey_response, climate_survey: survey, user: employee)

      post hr_climate_survey_responses_path, params: {
        climate_survey_id: survey.id,
        climate_survey_response: { rating: 3, recommend_score: 3 }
      }

      expect(ClimateSurveyResponse.where(climate_survey: survey, user: employee).count).to eq(1)
    end
  end
end
