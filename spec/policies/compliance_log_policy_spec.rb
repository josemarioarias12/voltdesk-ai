# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ComplianceLogPolicy do
  subject { described_class.new(user, compliance_log) }

  let(:workspace)       { create(:workspace) }
  let(:compliance_log)  { create(:compliance_log, workspace: workspace) }
  let(:super_admin)     { create(:user, workspace: workspace, role: :super_admin) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:agent)           { create(:user, workspace: workspace, role: :agent) }
  let(:employee)        { create(:user, workspace: workspace, role: :employee) }

  context 'when super_admin' do
    let(:user) { super_admin }

    it { is_expected.to be_index }
    it { is_expected.to be_show }
  end

  context 'when workspace_admin' do
    let(:user) { workspace_admin }

    it { is_expected.to be_index }
    it { is_expected.to be_show }
  end

  context 'when agent' do
    let(:user) { agent }

    it { is_expected.not_to be_index }
    it { is_expected.not_to be_show }
  end

  context 'when employee' do
    let(:user) { employee }

    it { is_expected.not_to be_index }
    it { is_expected.not_to be_show }
  end
end
