# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SpacePolicy do
  subject { described_class.new(user, space) }

  let(:workspace) { create(:workspace) }
  let(:space) { create(:space, workspace: workspace) }

  context 'when user is workspace_admin' do
    let(:user) { create(:user, workspace: workspace, role: :workspace_admin) }

    it { is_expected.to permit_action(:index) }
    it { is_expected.to permit_action(:show) }
    it { is_expected.to permit_action(:create) }
    it { is_expected.to permit_action(:update) }
    it { is_expected.to permit_action(:destroy) }
    it { is_expected.to permit_action(:utilization) }
    it { is_expected.to permit_action(:optimize) }
  end

  context 'when user is facilities_manager' do
    let(:user) { create(:user, workspace: workspace, role: :facilities_manager) }

    it { is_expected.to permit_action(:index) }
    it { is_expected.to permit_action(:show) }
    it { is_expected.to permit_action(:create) }
    it { is_expected.to permit_action(:utilization) }
    it { is_expected.to permit_action(:optimize) }
  end

  context 'when user is employee' do
    let(:user) { create(:user, workspace: workspace, role: :employee) }

    it { is_expected.to permit_action(:index) }
    it { is_expected.to permit_action(:show) }
    it { is_expected.not_to permit_action(:create) }
    it { is_expected.not_to permit_action(:update) }
    it { is_expected.not_to permit_action(:destroy) }
    it { is_expected.not_to permit_action(:optimize) }
  end

  context 'when user belongs to different workspace' do
    let(:other_workspace) { create(:workspace) }
    let(:user) { create(:user, workspace: other_workspace, role: :workspace_admin) }

    it { is_expected.not_to permit_action(:show) }
    it { is_expected.not_to permit_action(:update) }
  end
end
