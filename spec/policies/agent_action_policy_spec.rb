# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AgentActionPolicy do
  subject(:policy) { described_class.new(user, agent_action) }

  let(:workspace)    { create(:workspace) }
  let(:ticket)       { create(:ticket, workspace: workspace) }
  let(:agent_action) do
    create(:agent_action,
           workspace:   workspace,
           ticket:      ticket,
           action_type: :auto_resolve,
           status:      :pending_approval,
           confidence:  0.90)
  end

  context 'when user is workspace_admin' do
    let(:user) { create(:user, workspace: workspace, role: :workspace_admin) }

    it { is_expected.to permit_action(:index) }
    it { is_expected.to permit_action(:approve) }
    it { is_expected.to permit_action(:reject) }
  end

  context 'when user is agent' do
    let(:user) { create(:user, workspace: workspace, role: :agent) }

    it { is_expected.to permit_action(:index) }
    it { is_expected.to permit_action(:approve) }
    it { is_expected.to permit_action(:reject) }
  end

  context 'when user is employee' do
    let(:user) { create(:user, workspace: workspace, role: :employee) }

    it { is_expected.to forbid_action(:index) }
    it { is_expected.to forbid_action(:approve) }
    it { is_expected.to forbid_action(:reject) }
  end

  %i[hr_manager it_manager facilities_manager operations_manager department_manager].each do |manager_role|
    context "when user is #{manager_role}" do
      let(:user) { create(:user, workspace: workspace, role: manager_role) }

      it { is_expected.to permit_action(:index) }
      it { is_expected.to permit_action(:approve) }
      it { is_expected.to permit_action(:reject) }
    end
  end

  describe 'Scope' do
    let(:user) { create(:user, workspace: workspace, role: :agent) }
    let(:other_workspace) { create(:workspace) }
    let(:other_ticket) { create(:ticket, workspace: other_workspace) }

    before do
      create(:agent_action,
             workspace:   other_workspace,
             ticket:      other_ticket,
             action_type: :auto_resolve,
             status:      :pending_approval,
             confidence:  0.88)
    end

    it 'returns only pending actions for the user workspace' do
      scope = described_class::Scope.new(user, AgentAction).resolve
      expect(scope).to include(agent_action)
      expect(scope.map(&:workspace_id).uniq).to eq([workspace.id])
    end
  end
end
