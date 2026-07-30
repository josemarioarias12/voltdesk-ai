# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Tickets::UpdateTicket do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:user)       { create(:user, workspace: workspace, role: :agent, department: department) }
  let(:ticket)     { create(:ticket, workspace: workspace, department: department, status: :open) }

  describe '.call — valid transition' do
    it 'updates status from open to in_progress' do
      result = described_class.call(ticket: ticket, user: user, params: { status: :in_progress })
      expect(result).to be_success
      expect(ticket.reload.status).to eq('in_progress')
    end

    it 'records a status_changed activity' do
      expect do
        described_class.call(ticket: ticket, user: user, params: { status: :in_progress })
      end.to change(TicketActivity, :count).by(1)

      expect(ticket.activities.last.action).to eq(TicketActivity::STATUS_CHANGED)
      expect(ticket.activities.last.metadata['from']).to eq('open')
      expect(ticket.activities.last.metadata['to']).to eq('in_progress')
    end
  end

  describe '.call — invalid transition' do
    it 'returns failure for open → resolved' do
      result = described_class.call(ticket: ticket, user: user, params: { status: :resolved })
      expect(result).to be_failure
      expect(result.error).to include('Cannot transition')
    end

    it 'does not change the status' do
      described_class.call(ticket: ticket, user: user, params: { status: :resolved })
      expect(ticket.reload.status).to eq('open')
    end
  end

  describe '.call — field update' do
    it 'updates title' do
      result = described_class.call(ticket: ticket, user: user, params: { title: 'Updated title' })
      expect(result).to be_success
      expect(ticket.reload.title).to eq('Updated title')
    end
  end

  describe '.call — ActionCable broadcasts (Bug 1 fix)' do
    it 'broadcasts to both the workspace-wide stream and the per-ticket stream' do
      expect do
        described_class.call(ticket: ticket, user: user, params: { title: 'Broadcast test' })
      end.to have_broadcasted_to("tickets:#{workspace.id}").with(hash_including(event: 'ticket_updated', ticket_id: ticket.id))
                                                           .and have_broadcasted_to("ticket:#{ticket.id}").with(hash_including(event: 'ticket_updated', ticket_id: ticket.id))
    end

    it 'also broadcasts to both streams on a status transition' do
      expect do
        described_class.call(ticket: ticket, user: user, params: { status: :in_progress })
      end.to have_broadcasted_to("tickets:#{workspace.id}")
        .and have_broadcasted_to("ticket:#{ticket.id}")
    end
  end
end
