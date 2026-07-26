# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::ClimateSurveysController, type: :request do
  let(:workspace)  { create(:workspace) }
  let(:hr_manager) { create(:user, workspace: workspace, role: :hr_manager) }
  let(:employee)   { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /hr/climate_surveys' do
    before { sign_in hr_manager }

    it 'returns 200' do
      get hr_climate_surveys_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    context 'when the user is a regular employee' do
      before { sign_in employee }

      it 'is forbidden' do
        get hr_climate_surveys_path, headers: inertia_headers
        expect(response).to redirect_to(root_path)
      end
    end
  end

  describe 'GET /hr/climate_surveys/new' do
    before { sign_in hr_manager }

    it 'returns 200' do
      get new_hr_climate_survey_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /hr/climate_surveys' do
    before { sign_in hr_manager }

    it 'creates a draft survey and redirects to it' do
      expect do
        post hr_climate_surveys_path, params: { climate_survey: { title: 'Q1 2026 Pulse Check' } }
      end.to change(ClimateSurvey, :count).by(1)

      expect(ClimateSurvey.last.status).to eq('draft')
      expect(response).to redirect_to(hr_climate_survey_path(ClimateSurvey.last))
    end
  end

  describe 'GET /hr/climate_surveys/:id' do
    let(:survey) { create(:climate_survey, workspace: workspace, created_by: hr_manager) }

    before { sign_in hr_manager }

    it 'returns 200 with survey detail props' do
      get hr_climate_survey_path(survey), headers: inertia_headers
      json = response.parsed_body
      expect(json['props']['survey']).to include('title', 'ai_themes', 'can_close')
    end
  end

  describe 'POST /hr/climate_surveys/:id/close' do
    let(:survey) { create(:climate_survey, :active, workspace: workspace, created_by: hr_manager) }

    before { sign_in hr_manager }

    it 'closes the survey and enqueues analysis' do
      expect { post close_hr_climate_survey_path(survey) }
        .to have_enqueued_job(Hr::AnalyzeSurveyThemesJob)

      expect(survey.reload.status).to eq('closed')
    end
  end
end
