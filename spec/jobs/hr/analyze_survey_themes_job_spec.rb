# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::AnalyzeSurveyThemesJob do
  let(:workspace)  { create(:workspace) }
  let(:hr_manager) { create(:user, workspace: workspace, role: :hr_manager) }
  let(:survey)     { create(:climate_survey, :closed, workspace: workspace, created_by: hr_manager) }

  describe '#perform' do
    it 'calls Hr::AnalyzeSurveyThemes with the survey' do
      expect(Hr::AnalyzeSurveyThemes).to receive(:call).with(survey: survey).and_call_original

      described_class.new.perform(survey.id)
    end

    it 'does nothing when the survey no longer exists' do
      expect(Hr::AnalyzeSurveyThemes).not_to receive(:call)

      described_class.new.perform(-1)
    end

    it 'logs an error when the service fails' do
      allow(Hr::AnalyzeSurveyThemes).to receive(:call).and_return(ServiceResult.failure('boom'))
      expect(Rails.logger).to receive(:error).with(/boom/)

      described_class.new.perform(survey.id)
    end
  end
end
