# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::CloseClimateSurvey do
  let(:workspace)  { create(:workspace) }
  let(:hr_manager) { create(:user, workspace: workspace, role: :hr_manager) }
  let(:survey)     { create(:climate_survey, :active, workspace: workspace, created_by: hr_manager) }

  describe '.call' do
    it 'closes the survey' do
      result = described_class.call(survey: survey)

      expect(result).to be_success
      expect(result.data.status).to eq('closed')
    end

    it 'enqueues the theme analysis job' do
      expect { described_class.call(survey: survey) }
        .to have_enqueued_job(Hr::AnalyzeSurveyThemesJob).with(survey.id)
    end

    it 'returns failure when already closed' do
      survey.update!(status: :closed)

      result = described_class.call(survey: survey)

      expect(result).to be_failure
      expect(result.error).to eq('Survey is already closed')
    end
  end
end
