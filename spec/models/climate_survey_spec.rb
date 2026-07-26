# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ClimateSurvey do
  let(:workspace) { create(:workspace) }
  let(:hr_manager) { create(:user, workspace: workspace, role: :hr_manager) }

  describe 'validations' do
    it 'requires a title' do
      survey = build(:climate_survey, workspace: workspace, created_by: hr_manager, title: nil)
      expect(survey).not_to be_valid
    end
  end

  describe '#eligible_users' do
    context 'when department is nil (company-wide)' do
      let(:survey) { create(:climate_survey, workspace: workspace, created_by: hr_manager) }

      it 'includes all non-guest users in the workspace' do
        employee = create(:user, workspace: workspace, role: :employee)
        guest    = create(:user, workspace: workspace, role: :guest)

        expect(survey.eligible_users).to include(hr_manager, employee)
        expect(survey.eligible_users).not_to include(guest)
      end
    end

    context 'when scoped to a department' do
      let(:department)       { create(:department, workspace: workspace) }
      let(:other_department) { create(:department, workspace: workspace) }
      let(:survey) do
        create(:climate_survey, :for_department, workspace: workspace, created_by: hr_manager, department: department)
      end

      it 'only includes users from that department' do
        dept_user  = create(:user, workspace: workspace, department: department, role: :employee)
        other_user = create(:user, workspace: workspace, department: other_department, role: :employee)

        expect(survey.eligible_users).to include(dept_user)
        expect(survey.eligible_users).not_to include(other_user)
      end
    end
  end

  describe '.available_for' do
    let(:department)       { create(:department, workspace: workspace) }
    let(:other_department) { create(:department, workspace: workspace) }
    let(:user) { create(:user, workspace: workspace, department: department, role: :employee) }

    it 'includes active company-wide surveys' do
      survey = create(:climate_survey, :active, workspace: workspace, created_by: hr_manager)
      expect(described_class.available_for(user)).to include(survey)
    end

    it 'includes active surveys scoped to the user department' do
      survey = create(:climate_survey, :active, :for_department, workspace: workspace, created_by: hr_manager,
                                                                   department: department)
      expect(described_class.available_for(user)).to include(survey)
    end

    it 'excludes surveys scoped to a different department' do
      survey = create(:climate_survey, :active, :for_department, workspace: workspace, created_by: hr_manager,
                                                                   department: other_department)
      expect(described_class.available_for(user)).not_to include(survey)
    end

    it 'excludes draft surveys' do
      survey = create(:climate_survey, workspace: workspace, created_by: hr_manager)
      expect(described_class.available_for(user)).not_to include(survey)
    end

    it 'excludes surveys the user already responded to' do
      survey = create(:climate_survey, :active, workspace: workspace, created_by: hr_manager)
      create(:climate_survey_response, climate_survey: survey, user: user)
      expect(described_class.available_for(user)).not_to include(survey)
    end
  end

  describe '#participation_count and #eligible_count' do
    let(:department) { create(:department, workspace: workspace) }
    let(:survey) do
      create(:climate_survey, :active, :for_department, workspace: workspace, created_by: hr_manager,
                                                          department: department)
    end

    it 'reflects responses submitted versus eligible users' do
      responder     = create(:user, workspace: workspace, department: department, role: :employee)
      non_responder = create(:user, workspace: workspace, department: department, role: :employee)
      create(:climate_survey_response, climate_survey: survey, user: responder)

      expect(non_responder).to be_present
      expect(survey.participation_count).to eq(1)
      expect(survey.eligible_count).to eq(2)
    end
  end
end
