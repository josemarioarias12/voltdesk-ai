# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::ModelGovernanceSuggestionPolicy do
  subject(:policy) { described_class.new(user, suggestion) }

  let(:suggestion) { create(:ai_model_governance_suggestion) }

  context 'when user is super_admin' do
    let(:user) { create(:user, role: :super_admin, workspace: create(:workspace)) }

    it { is_expected.to permit_action(:index) }
    it { is_expected.to permit_action(:show) }
    it { is_expected.to permit_action(:approve) }
    it { is_expected.to permit_action(:reject) }
    it { is_expected.to permit_action(:mark_applied) }
    it { is_expected.to permit_action(:sync_now) }
  end

  context 'when user is workspace_admin' do
    let(:user) { create(:user, :workspace_admin) }

    it { is_expected.to permit_action(:index) }
    it { is_expected.to permit_action(:show) }
    it { is_expected.to permit_action(:approve) }
    it { is_expected.to permit_action(:reject) }
    it { is_expected.to permit_action(:mark_applied) }
    it { is_expected.to permit_action(:sync_now) }
  end

  context 'when user is hr_manager' do
    let(:user) { create(:user, :hr_manager) }

    it { is_expected.to forbid_action(:index) }
    it { is_expected.to forbid_action(:approve) }
  end

  context 'when user is it_manager' do
    let(:user) { create(:user, :it_manager) }

    it { is_expected.to forbid_action(:index) }
    it { is_expected.to forbid_action(:approve) }
  end

  context 'when user is facilities_manager' do
    let(:user) { create(:user, :facilities_manager) }

    it { is_expected.to forbid_action(:index) }
    it { is_expected.to forbid_action(:approve) }
  end

  context 'when user is operations_manager' do
    let(:user) { create(:user, :operations_manager) }

    it { is_expected.to forbid_action(:index) }
    it { is_expected.to forbid_action(:approve) }
  end

  context 'when user is department_manager' do
    let(:user) { create(:user, :department_manager) }

    it { is_expected.to forbid_action(:index) }
    it { is_expected.to forbid_action(:approve) }
  end

  context 'when user is agent' do
    let(:user) { create(:user, :agent) }

    it { is_expected.to forbid_action(:index) }
    it { is_expected.to forbid_action(:approve) }
  end

  context 'when user is employee' do
    let(:user) { create(:user, :employee) }

    it { is_expected.to forbid_action(:index) }
    it { is_expected.to forbid_action(:approve) }
  end

  context 'when user is guest' do
    let(:user) { create(:user, :guest) }

    it { is_expected.to forbid_action(:index) }
    it { is_expected.to forbid_action(:approve) }
  end

  describe 'Scope' do
    subject(:resolved_scope) { described_class::Scope.new(user, Ai::ModelGovernanceSuggestion.all).resolve }

    context 'when user is workspace_admin' do
      let(:user) { create(:user, :workspace_admin) }

      it 'returns all suggestions' do
        suggestion
        expect(resolved_scope).to eq(Ai::ModelGovernanceSuggestion.all)
      end
    end

    context 'when user is employee' do
      let(:user) { create(:user, :employee) }

      it 'returns none' do
        suggestion
        expect(resolved_scope).to be_empty
      end
    end
  end
end
