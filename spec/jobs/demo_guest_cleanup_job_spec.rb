# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DemoGuestCleanupJob do
  describe '#perform' do
    let!(:workspace)  { create(:workspace) }
    let!(:department) { create(:department, workspace: workspace) }

    let!(:old_guest) do
      create(:user, :guest, workspace: workspace, created_at: 8.days.ago)
    end
    let!(:recent_guest) do
      create(:user, :guest, workspace: workspace, created_at: 1.day.ago)
    end
    let!(:employee) do
      create(:user, workspace: workspace, role: :employee, created_at: 8.days.ago)
    end

    it 'destroys guests older than the retention window' do
      described_class.new.perform
      expect(User.exists?(old_guest.id)).to be false
    end

    it 'does not destroy guests within the retention window' do
      described_class.new.perform
      expect(User.exists?(recent_guest.id)).to be true
    end

    it 'does not destroy non-guest users regardless of age' do
      described_class.new.perform
      expect(User.exists?(employee.id)).to be true
    end

    it 'reassigns tickets from the purged guest to a removed-guest placeholder' do
      ticket = create(:ticket, workspace: workspace, department: department, created_by: old_guest)
      described_class.new.perform
      expect(Ticket.exists?(ticket.id)).to be true
      placeholder = User.find_by(email: "demo-guest-removed@workspace-#{workspace.id}.voltdesk.internal")
      expect(placeholder).to be_present
      expect(ticket.reload.created_by_id).to eq(placeholder.id)
    end

    it 'creates the placeholder as inactive so it cannot be used to sign in or be assigned tickets' do
      create(:ticket, workspace: workspace, department: department, created_by: old_guest)
      described_class.new.perform
      placeholder = User.find_by(email: "demo-guest-removed@workspace-#{workspace.id}.voltdesk.internal")
      expect(placeholder.active).to be false
    end

    it 'writes a ComplianceLog entry for the purge' do
      expect { described_class.new.perform }.to change(ComplianceLog, :count).by(1)
      log = ComplianceLog.last
      expect(log.event_type).to eq('bulk_delete')
      expect(log.resource_type).to eq('demo_guests')
      expect(log.workspace).to eq(workspace)
      expect(log.metadata['purged_count']).to eq(1)
    end

    it 'does not raise when a workspace has no guests to purge' do
      old_guest.destroy!
      expect { described_class.new.perform }.not_to raise_error
    end
  end
end
