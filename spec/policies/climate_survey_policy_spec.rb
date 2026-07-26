# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ClimateSurveyPolicy do
  subject { described_class.new(user, survey) }

  let(:workspace)  { create(:workspace) }
  let(:hr_manager) { create(:user, workspace: workspace, role: :hr_manager) }
  let(:survey)     { create(:climate_survey, :active, workspace: workspace, created_by: hr_manager) }

  context 'when hr_manager' do
    let(:user) { hr_manager }

    it { is_expected.to be_index }
    it { is_expected.to be_create }
    it { is_expected.to be_show }
    it { is_expected.to be_close }
  end

  context 'when workspace_admin' do
    let(:user) { create(:user, workspace: workspace, role: :workspace_admin) }

    it { is_expected.to be_index }
    it { is_expected.to be_create }
  end

  context 'when department_manager' do
    let(:user) { create(:user, workspace: workspace, role: :department_manager) }

    it { is_expected.not_to be_index }
    it { is_expected.not_to be_create }
    it { is_expected.not_to be_show }
  end

  describe 'respond?' do
    let(:user) { create(:user, workspace: workspace, role: :employee) }

    context 'when the survey is active and the user has not responded' do
      it { is_expected.to be_respond }
    end

    context 'when the survey is not active' do
      let(:survey) { create(:climate_survey, workspace: workspace, created_by: hr_manager) }

      it { is_expected.not_to be_respond }
    end

    context 'when the user already responded' do
      before { create(:climate_survey_response, climate_survey: survey, user: user) }

      it { is_expected.not_to be_respond }
    end

    context 'when the survey is scoped to a different department' do
      let(:department) { create(:department, workspace: workspace) }
      let(:survey) do
        create(:climate_survey, :active, :for_department, workspace: workspace, created_by: hr_manager,
                                                            department: department)
      end

      it { is_expected.not_to be_respond }
    end
  end

  describe 'Scope' do
    it 'resolves to all surveys in the workspace' do
      other_survey = create(:climate_survey, workspace: workspace, created_by: hr_manager)
      user = create(:user, workspace: workspace, role: :employee)

      result = described_class::Scope.new(user, ClimateSurvey.all).resolve
      expect(result).to include(survey, other_survey)
    end
  end
end
