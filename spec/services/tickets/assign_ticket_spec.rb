# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Tickets::AssignTicket do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:ticket)     { create(:ticket, workspace: workspace, department: department) }

  describe '.call' do
    context 'when agents are available' do
      let!(:busy_agent) { create(:user, workspace: workspace, department: department, role: :agent, active: true) }
      let!(:free_agent) { create(:user, workspace: workspace, department: department, role: :agent, active: true) }

      before do
        create_list(:ticket, 2, workspace: workspace, department: department,
                                assigned_to: busy_agent, status: :open)
      end

      it 'assigns to the least loaded agent' do
        result = described_class.call(ticket: ticket)
        expect(result).to be_success
        expect(ticket.reload.assigned_to).to eq(free_agent)
      end

      it 'records an assigned activity' do
        expect { described_class.call(ticket: ticket) }.to change(TicketActivity, :count).by(1)
        expect(ticket.activities.last.action).to eq(TicketActivity::ASSIGNED)
      end
    end

    context 'when no agents are available' do
      it 'returns failure' do
        result = described_class.call(ticket: ticket)
        expect(result).to be_failure
        expect(result.error).to include('No agents available')
      end
    end
  end
end
