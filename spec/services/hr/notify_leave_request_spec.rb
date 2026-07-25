# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Hr::NotifyLeaveRequest do
  let(:workspace)     { create(:workspace) }
  let(:employee)      { create(:user, workspace: workspace, role: :employee) }
  let(:hr_manager)    { create(:user, workspace: workspace, role: :hr_manager) }
  let(:leave_request) { create(:leave_request, user: employee, workspace: workspace) }

  before { allow(ActionCable.server).to receive(:broadcast) }

  describe '.call with :submitted event' do
    subject(:call) { described_class.call(leave_request: leave_request, event: :submitted) }

    it 'creates a notification for each hr_manager' do
      hr_manager
      expect { call }.to change(Notification, :count).by(1)
    end

    it 'broadcasts to the hr_manager channel' do
      hr_manager
      call
      expect(ActionCable.server).to have_received(:broadcast).with(
        "notifications_#{hr_manager.id}", anything
      )
    end
  end

  describe '.call with :pending_second_approval event' do
    subject(:call) { described_class.call(leave_request: leave_request, event: :pending_second_approval) }

    let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
    let(:super_admin)     { create(:user, workspace: workspace, role: :super_admin) }

    it 'creates a notification for each admin in the workspace' do
      workspace_admin
      super_admin
      expect { call }.to change(Notification, :count).by(2)
    end

    it 'does not notify hr_managers or department_managers' do
      hr_manager
      workspace_admin
      call
      expect(ActionCable.server).not_to have_received(:broadcast).with(
        "notifications_#{hr_manager.id}", anything
      )
    end

    it 'broadcasts to each admin channel' do
      workspace_admin
      call
      expect(ActionCable.server).to have_received(:broadcast).with(
        "notifications_#{workspace_admin.id}", anything
      )
    end

    it 'sets the pending_second_approval notification type' do
      workspace_admin
      call
      expect(Notification.last.notification_type).to eq('leave_request_pending_second_approval')
    end
  end

  describe '.call with :approved event' do
    subject(:call) { described_class.call(leave_request: leave_request, event: :approved) }

    it 'creates a notification for the employee' do
      expect { call }.to change(Notification, :count).by(1)
    end

    it 'broadcasts to the employee channel' do
      call
      expect(ActionCable.server).to have_received(:broadcast).with(
        "notifications_#{employee.id}", anything
      )
    end

    it 'sets approved notification type' do
      call
      notification = Notification.last
      expect(notification.notification_type).to eq('leave_request_approved')
    end
  end

  describe '.call with :rejected event' do
    subject(:call) { described_class.call(leave_request: leave_request, event: :rejected) }

    it 'creates a notification for the employee' do
      expect { call }.to change(Notification, :count).by(1)
    end

    it 'sets rejected notification type' do
      call
      expect(Notification.last.notification_type).to eq('leave_request_rejected')
    end
  end
end
