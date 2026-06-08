# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AssetIncidentPolicy do
  subject { described_class.new(user, record) }

  let(:workspace) { create(:workspace) }
  let(:asset)     { create(:asset, workspace: workspace) }
  let(:record)    { create(:asset_incident, asset: asset) }

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

    it { is_expected.to be_destroy }
  end

  context 'when super_admin' do
    let(:user) { create(:user, role: :super_admin, workspace: workspace) }

    it { is_expected.to be_destroy }
  end

  context 'when employee' do
    let(:user) { create(:user, workspace: workspace, role: :employee) }

    it { is_expected.not_to be_index }
    it { is_expected.not_to be_create }
  end
end
