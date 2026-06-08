# frozen_string_literal: true

require 'rails_helper'

RSpec.describe OnboardingPlanPolicy do
  subject { described_class.new(user, plan) }

  let(:workspace) { create(:workspace) }
  let(:owner)     { create(:user, workspace: workspace, role: :employee) }
  let(:plan)      { create(:onboarding_plan, user: owner, workspace: workspace) }

  context 'when the plan owner' do
    let(:user) { owner }

    it { is_expected.to be_show }
    it { is_expected.to be_update }
  end

  context 'when hr_manager' do
    let(:user) { create(:user, workspace: workspace, role: :hr_manager) }

    it { is_expected.to be_show }
    it { is_expected.to be_update }
  end

  context 'when workspace_admin' do
    let(:user) { create(:user, workspace: workspace, role: :workspace_admin) }

    it { is_expected.to be_show }
    it { is_expected.to be_update }
  end

  context 'when different employee' do
    let(:user) { create(:user, workspace: workspace, role: :employee) }

    it { is_expected.not_to be_show }
    it { is_expected.not_to be_update }
  end

  describe 'Scope' do
    let(:other_employee) { create(:user, workspace: workspace, role: :employee) }
    let!(:own_plan)      { create(:onboarding_plan, user: owner, workspace: workspace) }
    let!(:other_plan)    { create(:onboarding_plan, user: other_employee, workspace: workspace) }

    context 'when hr_manager' do
      let(:user) { create(:user, workspace: workspace, role: :hr_manager) }

      it 'sees all plans in workspace' do
        result = described_class::Scope.new(user, OnboardingPlan.all).resolve
        expect(result).to include(own_plan, other_plan)
      end
    end

    context 'when employee' do
      let(:user) { owner }

      it 'sees only own plan' do
        result = described_class::Scope.new(user, OnboardingPlan.all).resolve
        expect(result).to include(own_plan)
        expect(result).not_to include(other_plan)
      end
    end
  end
end
