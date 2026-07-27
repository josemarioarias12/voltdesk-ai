# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::MyTickets do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:user)       { create(:user, workspace: workspace, department: department, role: :employee) }

  describe '.visible_to?' do
    it 'is visible to every role except guest' do
      %i[super_admin workspace_admin hr_manager it_manager facilities_manager
         operations_manager department_manager agent employee].each do |role|
        expect(described_class.visible_to?(build(:user, role: role))).to be(true)
      end
    end

    it 'is not visible to guest' do
      expect(described_class.visible_to?(build(:user, role: :guest))).to be(false)
    end
  end

  describe '#call' do
    subject(:result) { described_class.new(user: user, workspace: workspace).call }

    it 'returns success' do
      expect(result).to be_success
    end

    it 'only counts tickets created by the current user' do
      create(:ticket, workspace: workspace, department: department, created_by: user, status: :open)
      other_user = create(:user, workspace: workspace, department: department)
      create(:ticket, workspace: workspace, department: department, created_by: other_user, status: :open)

      expect(result.data[:total]).to eq(1)
    end

    it 'breaks down by status' do
      create(:ticket, workspace: workspace, department: department, created_by: user, status: :open)
      create(:ticket, workspace: workspace, department: department, created_by: user, status: :resolved)

      expect(result.data[:by_status]['open']).to eq(1)
      expect(result.data[:by_status]['resolved']).to eq(1)
    end

    it 'reports open_count using the open_tickets scope' do
      create(:ticket, workspace: workspace, department: department, created_by: user, status: :in_progress)
      create(:ticket, workspace: workspace, department: department, created_by: user, status: :closed)

      expect(result.data[:open_count]).to eq(1)
    end
  end
end
