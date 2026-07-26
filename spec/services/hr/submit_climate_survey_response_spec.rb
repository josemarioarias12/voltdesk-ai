# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::SubmitClimateSurveyResponse do
  let(:workspace)  { create(:workspace) }
  let(:hr_manager) { create(:user, workspace: workspace, role: :hr_manager) }
  let(:employee)   { create(:user, workspace: workspace, role: :employee) }

  describe '.call' do
    context 'when the survey is company-wide and active' do
      let(:survey) { create(:climate_survey, :active, workspace: workspace, created_by: hr_manager) }

      it 'creates a response' do
        result = described_class.call(
          survey: survey, user: employee, params: { rating: 4, recommend_score: 5, feedback: 'Good place to work.' }
        )

        expect(result).to be_success
        expect(result.data.user).to eq(employee)
      end
    end

    context 'when the survey is scoped to a different department' do
      let(:department) { create(:department, workspace: workspace) }
      let(:survey) do
        create(:climate_survey, :active, :for_department, workspace: workspace, created_by: hr_manager,
                                                            department: department)
      end

      it 'rejects an ineligible user' do
        result = described_class.call(survey: survey, user: employee, params: { rating: 4, recommend_score: 4 })

        expect(result).to be_failure
        expect(result.error).to eq('You are not eligible to respond to this survey')
      end
    end

    context 'when the survey is not active' do
      let(:survey) { create(:climate_survey, workspace: workspace, created_by: hr_manager) }

      it 'returns failure' do
        result = described_class.call(survey: survey, user: employee, params: { rating: 4, recommend_score: 4 })

        expect(result).to be_failure
        expect(result.error).to eq('Survey is not currently accepting responses')
      end
    end

    context 'when the user already responded' do
      let(:survey) { create(:climate_survey, :active, workspace: workspace, created_by: hr_manager) }

      it 'returns failure on the second attempt' do
        create(:climate_survey_response, climate_survey: survey, user: employee)

        result = described_class.call(survey: survey, user: employee, params: { rating: 3, recommend_score: 3 })

        expect(result).to be_failure
      end
    end
  end
end
