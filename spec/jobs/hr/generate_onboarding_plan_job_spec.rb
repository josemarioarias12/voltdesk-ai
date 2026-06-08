# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::GenerateOnboardingPlanJob do
  describe '#perform' do
    let(:workspace) { create(:workspace) }
    let(:user)      { create(:user, workspace: workspace, role: :employee) }

    it 'calls GenerateOnboardingPlan with the user' do
      allow(Hr::GenerateOnboardingPlan).to receive(:call).and_return(ServiceResult.success)
      described_class.new.perform(user.id)
      expect(Hr::GenerateOnboardingPlan).to have_received(:call).with(user: user)
    end

    it 'does nothing when user does not exist' do
      allow(Hr::GenerateOnboardingPlan).to receive(:call)
      described_class.new.perform(0)
      expect(Hr::GenerateOnboardingPlan).not_to have_received(:call)
    end

    it 'logs error on failure without raising' do
      allow(Hr::GenerateOnboardingPlan).to receive(:call)
        .and_return(ServiceResult.failure('AI failed'))
      allow(Rails.logger).to receive(:error)
      expect { described_class.new.perform(user.id) }.not_to raise_error
      expect(Rails.logger).to have_received(:error).with(/GenerateOnboardingPlanJob failed/)
    end
  end
end
