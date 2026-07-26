# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::ActivateClimateSurvey do
  let(:workspace)  { create(:workspace) }
  let(:hr_manager) { create(:user, workspace: workspace, role: :hr_manager) }
  let(:survey)     { create(:climate_survey, workspace: workspace, created_by: hr_manager) }

  describe '.call' do
    it 'activates a draft survey' do
      result = described_class.call(survey: survey)

      expect(result).to be_success
      expect(result.data.status).to eq('active')
    end

    it 'returns failure when the survey is already active' do
      survey.update!(status: :active)

      result = described_class.call(survey: survey)

      expect(result).to be_failure
      expect(result.error).to eq('Only draft surveys can be activated')
    end

    it 'returns failure when the survey is already closed' do
      survey.update!(status: :closed)

      result = described_class.call(survey: survey)

      expect(result).to be_failure
      expect(result.error).to eq('Only draft surveys can be activated')
    end
  end
end
