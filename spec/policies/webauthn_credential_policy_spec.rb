# frozen_string_literal: true

require 'rails_helper'

RSpec.describe WebauthnCredentialPolicy do
  subject { described_class.new(user, credential) }

  let!(:workspace)       { create(:workspace) }
  let!(:owner)           { create(:user, workspace: workspace, role: :employee) }
  let!(:other_employee)  { create(:user, workspace: workspace, role: :employee) }
  let!(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let!(:credential)      { create(:webauthn_credential, user: owner, workspace: workspace) }

  context 'when the user owns the credential' do
    let(:user) { owner }

    it { is_expected.to be_index }
    it { is_expected.to be_destroy }
  end

  context 'when the user is a different employee' do
    let(:user) { other_employee }

    it { is_expected.to be_index }
    it { is_expected.not_to be_destroy }
  end

  context "when the user is a workspace_admin acting on someone else's credential" do
    let(:user) { workspace_admin }

    it { is_expected.to be_destroy }
  end

  describe 'Scope' do
    let!(:other_workspace)      { create(:workspace) }
    let!(:other_workspace_user) { create(:user, workspace: other_workspace) }
    let!(:other_workspace_credential) { create(:webauthn_credential, user: other_workspace_user, workspace: other_workspace) }

    it "only returns the current user's own credentials, never a workspace-mate's or another tenant's" do
      resolved = described_class::Scope.new(owner, WebauthnCredential).resolve

      expect(resolved).to contain_exactly(credential)
    end
  end
end
