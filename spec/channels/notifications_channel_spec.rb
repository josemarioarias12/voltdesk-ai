# frozen_string_literal: true

require 'rails_helper'

RSpec.describe NotificationsChannel, type: :channel do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :agent) }

  before { stub_connection current_user: user }

  it 'confirms subscription for authenticated user' do
    subscribe
    expect(subscription).to be_confirmed
  end

  it 'rejects when no current_user' do
    stub_connection current_user: nil
    subscribe
    expect(subscription).to be_rejected
  end

  it 'marks a single notification as read' do
    notification = create(:notification, user: user, workspace: workspace, read: false)
    subscribe
    perform :mark_read, notification_id: notification.id
    expect(notification.reload.read).to be true
  end

  it 'marks all notifications as read' do
    create_list(:notification, 2, user: user, workspace: workspace, read: false)
    subscribe
    perform :mark_read, notification_id: 'all'
    expect(user.notifications.unread.count).to eq(0)
  end
end
