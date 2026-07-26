# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::CreateClimateSurvey do
  let(:workspace)  { create(:workspace) }
  let(:hr_manager) { create(:user, workspace: workspace, role: :hr_manager) }

  describe '.call' do
    it 'creates a survey in draft status' do
      result = described_class.call(
        workspace: workspace, created_by: hr_manager, params: { title: 'Q1 2026 Satisfaction' }
      )

      expect(result).to be_success
      expect(result.data.status).to eq('draft')
      expect(result.data.created_by).to eq(hr_manager)
    end

    it 'returns failure when title is missing' do
      result = described_class.call(workspace: workspace, created_by: hr_manager, params: { title: '' })

      expect(result).to be_failure
    end

    it 'accepts an optional department scope' do
      department = create(:department, workspace: workspace)
      result = described_class.call(
        workspace: workspace, created_by: hr_manager,
        params: { title: 'Customer Service Pulse Check', department_id: department.id }
      )

      expect(result).to be_success
      expect(result.data.department).to eq(department)
    end
  end
end
