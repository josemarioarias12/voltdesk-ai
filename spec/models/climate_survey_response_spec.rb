# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ClimateSurveyResponse do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :employee) }
  let(:survey)    { create(:climate_survey, :active, workspace: workspace, created_by: user) }

  describe 'validations' do
    subject(:response) { build(:climate_survey_response, climate_survey: survey, user: user) }

    it { is_expected.to be_valid }

    it 'rejects a rating outside 1-5' do
      response.rating = 6
      expect(response).not_to be_valid
    end

    it 'rejects a recommend_score outside 1-5' do
      response.recommend_score = 0
      expect(response).not_to be_valid
    end

    it 'rejects a second response from the same user for the same survey' do
      create(:climate_survey_response, climate_survey: survey, user: user)
      expect(response).not_to be_valid
    end

    it 'allows the same user to respond to a different survey' do
      create(:climate_survey_response, climate_survey: survey, user: user)
      other_survey = create(:climate_survey, :active, workspace: workspace, created_by: user)
      response.climate_survey = other_survey
      expect(response).to be_valid
    end

    context 'when the survey is not active' do
      let(:survey) { create(:climate_survey, workspace: workspace, created_by: user) }

      it 'is invalid' do
        expect(response).not_to be_valid
      end
    end

    context 'when the survey is closed' do
      let(:survey) { create(:climate_survey, :closed, workspace: workspace, created_by: user) }

      it 'is invalid' do
        expect(response).not_to be_valid
      end
    end
  end
end
