# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SettingsPolicy do
  subject { described_class.new(user, :settings) }

  let(:workspace) { create(:workspace) }

  context 'when workspace_admin' do
    let(:user) { create(:user, workspace: workspace, role: :workspace_admin) }

    it { is_expected.to be_index }
    it { is_expected.to be_update_ai }
  end

  context 'when super_admin' do
    let(:user) { create(:user, role: :super_admin, workspace: workspace) }

    it { is_expected.to be_index }
    it { is_expected.to be_update_ai }
  end

  context 'when employee' do
    let(:user) { create(:user, workspace: workspace, role: :employee) }

    it { is_expected.not_to be_index }
    it { is_expected.not_to be_update_ai }
  end

  context 'when agent' do
    let(:user) { create(:user, workspace: workspace, role: :agent) }

    it { is_expected.not_to be_index }
    it { is_expected.not_to be_update_ai }
  end
end
