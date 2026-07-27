# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::MyNotifications do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace) }

  describe '.visible_to?' do
    it 'is visible to every role, including guest' do
      %i[super_admin workspace_admin hr_manager it_manager facilities_manager
         operations_manager department_manager agent employee guest].each do |role|
        expect(described_class.visible_to?(build(:user, role: role))).to be(true)
      end
    end
  end

  describe '#call' do
    subject(:result) { described_class.new(user: user, workspace: workspace).call }

    it 'returns success' do
      expect(result).to be_success
    end

    it 'only counts unread notifications for the current user' do
      create(:notification, workspace: workspace, user: user, read: false)
      create(:notification, workspace: workspace, user: user, read: true)
      other = create(:user, workspace: workspace)
      create(:notification, workspace: workspace, user: other, read: false)

      expect(result.data[:unread_count]).to eq(1)
    end

    it 'breaks down unread notifications by type' do
      create(:notification, workspace: workspace, user: user, read: false, notification_type: :ticket_assigned)
      create(:notification, workspace: workspace, user: user, read: false, notification_type: :daily_digest)

      expect(result.data[:unread_by_type]['ticket_assigned']).to eq(1)
      expect(result.data[:unread_by_type]['daily_digest']).to eq(1)
    end

    it "never leaks another user's notifications, even within the same workspace" do
      other = create(:user, workspace: workspace)
      create(:notification, workspace: workspace, user: other, read: false)

      expect(result.data[:unread_count]).to eq(0)
    end
  end
end
