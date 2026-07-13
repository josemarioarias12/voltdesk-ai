# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'ApplicationController shared props', type: :request do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }

  describe 'active_tickets_count' do
    it 'counts only tickets created by the current user when employee' do
      employee = create(:user, workspace: workspace, role: :employee)
      other    = create(:user, workspace: workspace, role: :employee)
      create(:ticket, workspace: workspace, department: department, created_by: employee, status: :open)
      create(:ticket, workspace: workspace, department: department, created_by: other, status: :open)

      sign_in employee
      get tickets_path, headers: inertia_headers
      json = response.parsed_body

      expect(json['props']['active_tickets_count']).to eq(1)
    end

    it 'counts only tickets assigned to the current user when agent' do
      agent       = create(:user, workspace: workspace, role: :agent, department: department)
      other_agent = create(:user, workspace: workspace, role: :agent, department: department)
      creator     = create(:user, workspace: workspace, role: :employee)
      create(:ticket, workspace: workspace, department: department, created_by: creator, assigned_to: agent, status: :open)
      create(:ticket, workspace: workspace, department: department, created_by: creator, assigned_to: other_agent, status: :open)

      sign_in agent
      get tickets_path, headers: inertia_headers
      json = response.parsed_body

      expect(json['props']['active_tickets_count']).to eq(1)
    end

    it 'counts all workspace tickets for workspace_admin' do
      admin   = create(:user, workspace: workspace, role: :workspace_admin)
      creator = create(:user, workspace: workspace, role: :employee)
      create(:ticket, workspace: workspace, department: department, created_by: creator, status: :open)
      create(:ticket, workspace: workspace, department: department, created_by: creator, status: :in_progress)

      sign_in admin
      get tickets_path, headers: inertia_headers
      json = response.parsed_body

      expect(json['props']['active_tickets_count']).to eq(2)
    end

    it 'excludes resolved and closed tickets from the count' do
      employee = create(:user, workspace: workspace, role: :employee)
      create(:ticket, workspace: workspace, department: department, created_by: employee, status: :resolved)

      sign_in employee
      get tickets_path, headers: inertia_headers
      json = response.parsed_body

      expect(json['props']['active_tickets_count']).to eq(0)
    end
  end
end
