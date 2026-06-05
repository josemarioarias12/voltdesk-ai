# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DailyDigestJob do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :employee) }

  before do
    allow(ActionCable.server).to receive(:broadcast)
  end

  it 'creates a notification when user has open tickets' do
    create(:ticket, workspace: workspace, assigned_to: user, status: :open)

    expect { described_class.new.perform }.to change(Notification, :count).by(1)

    notification = Notification.last
    expect(notification.user).to eq(user)
    expect(notification.notification_type).to eq('daily_digest')
  end

  it 'skips users with nothing to report' do
    expect { described_class.new.perform }.not_to change(Notification, :count)
  end

  it 'broadcasts via ActionCable after creating notification' do
    create(:ticket, workspace: workspace, assigned_to: user, status: :open)

    described_class.new.perform

    expect(ActionCable.server).to have_received(:broadcast).with(
      "notifications_#{user.id}",
      hash_including(notification_type: 'daily_digest')
    )
  end
end
