# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::CrossModuleInsight do
  subject(:tool)    { described_class.new(user: admin, workspace: workspace, locale: 'en') }

  let(:workspace)   { create(:workspace) }
  let(:it_dept)     { create(:department, workspace: workspace, name: 'IT') }
  let(:hr_dept)     { create(:department, workspace: workspace, name: 'HR') }
  let(:admin)       { create(:user, workspace: workspace, role: :workspace_admin) }

  describe '.visible_to?' do
    it 'is visible only to roles that see all tickets AND all assets workspace-wide' do
      visible = %i[super_admin workspace_admin it_manager operations_manager]
      not_visible = %i[hr_manager facilities_manager department_manager agent employee guest]

      visible.each do |role|
        expect(described_class.visible_to?(build(:user, role: role))).to be(true)
      end

      not_visible.each do |role|
        expect(described_class.visible_to?(build(:user, role: role))).to be(false)
      end
    end
  end

  describe '#call' do
    it 'ranks departments by combined urgency_score + risk_score, worst first' do
      create(:ticket, workspace: workspace, department: it_dept, status: :open, urgency_score: 90)
      create(:ticket, workspace: workspace, department: hr_dept, status: :open, urgency_score: 10)

      result = tool.call

      expect(result).to be_success
      names = result.data[:departments].pluck(:department)
      expect(names.first).to eq('IT')
      expect(result.data[:department_needing_most_help][:department]).to eq('IT')
    end

    it 'sums urgency_score across open tickets and risk_score across high-risk assets' do
      create(:ticket, workspace: workspace, department: it_dept, status: :open, urgency_score: 40)
      create(:ticket, workspace: workspace, department: it_dept, status: :open, urgency_score: 30)
      create(:asset, :high_risk, workspace: workspace, department: it_dept)

      result = tool.call
      row = result.data[:departments].find { |r| r[:department] == 'IT' }

      expect(row[:open_tickets]).to eq(2)
      expect(row[:high_risk_assets]).to eq(1)
      expect(row[:score]).to eq(40 + 30 + 85)
    end

    it 'excludes resolved and closed tickets from the score' do
      create(:ticket, workspace: workspace, department: it_dept, status: :resolved, urgency_score: 99)
      create(:ticket, workspace: workspace, department: it_dept, status: :closed, urgency_score: 99)

      result = tool.call
      row = result.data[:departments].find { |r| r[:department] == 'IT' }

      expect(row[:open_tickets]).to eq(0)
      expect(row[:score]).to eq(0)
    end

    it 'excludes assets at exactly the threshold (risk_score must be strictly greater than 70)' do
      create(:asset, workspace: workspace, department: it_dept, risk_score: 70)

      result = tool.call
      row = result.data[:departments].find { |r| r[:department] == 'IT' }

      expect(row[:high_risk_assets]).to eq(0)
    end

    it 'does not attribute assets with no department to any department' do
      create(:asset, :high_risk, workspace: workspace, department: nil)

      result = tool.call
      total_high_risk = result.data[:departments].sum { |r| r[:high_risk_assets] }

      expect(total_high_risk).to eq(0)
    end

    it 'never counts tickets or assets from a different workspace' do
      it_dept
      other_workspace = create(:workspace)
      other_dept = create(:department, workspace: other_workspace)
      create(:ticket, workspace: other_workspace, department: other_dept, status: :open, urgency_score: 99)

      result = tool.call
      row = result.data[:departments].find { |r| r[:department] == 'IT' }

      expect(row[:score]).to eq(0)
    end
  end
end
