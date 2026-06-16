# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Workspace Isolation' do
  let!(:workspace_a) { create(:workspace) }
  let!(:workspace_b) { create(:workspace) }

  let!(:user_a) { create(:user, workspace: workspace_a, role: :employee) }
  let!(:user_b) { create(:user, workspace: workspace_b, role: :employee) }

  let!(:dept_a) { create(:department, workspace: workspace_a) }
  let!(:dept_b) { create(:department, workspace: workspace_b) }

  before do
    Current.workspace = workspace_a
    Current.user      = user_a
  end

  after do
    Current.workspace = nil
    Current.user      = nil
  end

  describe 'Department model' do
    it 'does not return departments from another workspace' do
      departments = Department.all.to_a
      expect(departments).to include(dept_a)
      expect(departments).not_to include(dept_b)
    end

    it 'raises RecordNotFound when finding a department from another workspace' do
      expect { Department.find(dept_b.id) }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe 'User model' do
    it 'does not return users from another workspace' do
      users = User.all.to_a
      expect(users).to include(user_a)
      expect(users).not_to include(user_b)
    end
  end

  describe 'Pundit workspace policy' do
    it 'denies user_a access to workspace_b' do
      policy = WorkspacePolicy.new(user_a, workspace_b)
      expect(policy.show?).to be false
    end

    it 'allows user_a access to workspace_a' do
      policy = WorkspacePolicy.new(user_a, workspace_a)
      expect(policy.show?).to be true
    end
  end
end
