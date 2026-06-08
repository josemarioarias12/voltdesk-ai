# frozen_string_literal: true

require 'rails_helper'

RSpec.describe WorkspacePolicy do
  subject { described_class.new(user, workspace) }

  let(:workspace) { create(:workspace) }

  context 'when super_admin' do
    let(:user) { create(:user, role: :super_admin, workspace: workspace) }

    it { is_expected.to be_index }
    it { is_expected.to be_show }
    it { is_expected.to be_create }
    it { is_expected.to be_update }
    it { is_expected.to be_destroy }
    it { is_expected.to be_manage_demo }
  end

  context 'when workspace_admin of the same workspace' do
    let(:user) { create(:user, workspace: workspace, role: :workspace_admin) }

    it { is_expected.not_to be_index }
    it { is_expected.to be_show }
    it { is_expected.not_to be_create }
    it { is_expected.to be_update }
    it { is_expected.not_to be_destroy }
    it { is_expected.to be_manage_demo }
  end

  context 'when workspace_admin of a different workspace' do
    let(:other_workspace) { create(:workspace) }
    let(:user)            { create(:user, workspace: other_workspace, role: :workspace_admin) }

    it { is_expected.not_to be_show }
    it { is_expected.not_to be_update }
    it { is_expected.not_to be_manage_demo }
  end

  context 'when employee' do
    let(:user) { create(:user, workspace: workspace, role: :employee) }

    it { is_expected.not_to be_index }
    it { is_expected.not_to be_create }
    it { is_expected.not_to be_destroy }
    it { is_expected.not_to be_manage_demo }
  end

  describe 'Scope' do
    context 'when super_admin' do
      let(:other_workspace) { create(:workspace) }
      let(:user)            { create(:user, role: :super_admin, workspace: workspace) }

      it 'returns all workspaces' do
        other_workspace
        result = described_class::Scope.new(user, Workspace.all).resolve
        expect(result).to include(workspace, other_workspace)
      end
    end

    context 'when workspace_admin' do
      let(:other_workspace) { create(:workspace) }
      let(:user)            { create(:user, workspace: workspace, role: :workspace_admin) }

      it 'returns only own workspace' do
        result = described_class::Scope.new(user, Workspace.all).resolve
        expect(result).to include(workspace)
        expect(result).not_to include(other_workspace)
      end
    end
  end
end
