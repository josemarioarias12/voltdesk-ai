# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::NotifyOnboardingReady do
  subject(:call) { described_class.call(plan: plan) }

  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :employee) }
  let(:plan)      { create(:onboarding_plan, user: user, workspace: workspace) }

  before { allow(ActionCable.server).to receive(:broadcast) }

  it 'creates a notification for the user' do
    expect { call }.to change(Notification, :count).by(1)
  end

  it 'sets correct notification type' do
    call
    expect(Notification.last.notification_type).to eq('onboarding_plan_ready')
  end

  it 'broadcasts to the user channel' do
    call
    expect(ActionCable.server).to have_received(:broadcast).with(
      "notifications_#{user.id}", anything
    )
  end

  it 'includes the plan id in broadcast payload' do
    call
    expect(ActionCable.server).to have_received(:broadcast).with(
      anything,
      hash_including(resource_type: 'OnboardingPlan', resource_id: plan.id)
    )
  end
end
