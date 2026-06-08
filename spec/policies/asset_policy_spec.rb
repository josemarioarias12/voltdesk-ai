# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AssetPolicy do
  subject { described_class.new(user, asset) }

  let(:workspace) { create(:workspace) }
  let(:asset)     { create(:asset, workspace: workspace) }

  context 'when it_manager' do
    let(:user) { create(:user, workspace: workspace, role: :it_manager) }

    it { is_expected.to be_index }
    it { is_expected.to be_show }
    it { is_expected.to be_create }
    it { is_expected.to be_update }
    it { is_expected.not_to be_destroy }
  end

  context 'when workspace_admin' do
    let(:user) { create(:user, workspace: workspace, role: :workspace_admin) }

    it { is_expected.to be_index }
    it { is_expected.to be_destroy }
  end

  context 'when super_admin' do
    let(:user) { create(:user, role: :super_admin, workspace: workspace) }

    it { is_expected.to be_index }
    it { is_expected.to be_destroy }
  end

  context 'when operations_manager' do
    let(:user) { create(:user, workspace: workspace, role: :operations_manager) }

    it { is_expected.to be_index }
    it { is_expected.to be_show }
    it { is_expected.not_to be_create }
    it { is_expected.not_to be_destroy }
  end

  context 'when employee' do
    let(:user) { create(:user, workspace: workspace, role: :employee) }

    it { is_expected.not_to be_index }
    it { is_expected.not_to be_show }
    it { is_expected.not_to be_create }
    it { is_expected.not_to be_destroy }
  end

  describe 'Scope' do
    let(:user)          { create(:user, workspace: workspace, role: :it_manager) }
    let(:other_ws)      { create(:workspace) }
    let!(:own_asset)    { create(:asset, workspace: workspace) }
    let!(:foreign_asset) { create(:asset, workspace: other_ws) }

    it 'returns only assets in the same workspace' do
      result = described_class::Scope.new(user, Asset.all).resolve
      expect(result).to include(own_asset)
      expect(result).not_to include(foreign_asset)
    end
  end
end
