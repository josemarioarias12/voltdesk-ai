# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Tickets::CreateTicket do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:user)       { create(:user, workspace: workspace, role: :employee, department: department) }
  let!(:sla_policy) do
    create(:sla_policy, workspace: workspace, priority: :medium,
                        first_response_hours: 4, resolution_hours: 24)
  end

  let(:valid_params) do
    {
      title: 'VPN not connecting after update',
      description: 'Error 800 after Windows update.',
      department_id: department.id,
      priority: :medium,
      source: :web
    }
  end

  before do
    allow(Ai::ClassifyTicketJob).to receive(:perform_later)
  end

  describe '.call' do
    context 'with valid params' do
      subject(:result) { described_class.call(workspace: workspace, user: user, params: valid_params) }

      it 'returns success' do
        expect(result).to be_success
      end

      it 'creates a ticket' do
        expect { result }.to change(Ticket, :count).by(1)
      end

      it 'generates a TK-NNNNN ticket number' do
        expect(result.data.ticket_number).to match(/\ATK-\d{5}\z/)
      end

      it 'assigns workspace and creator' do
        expect(result.data.workspace).to eq(workspace)
        expect(result.data.created_by).to eq(user)
      end

      it 'calculates due_at from SLA policy' do
        expect(result.data.due_at).to be_present
      end

      it 'enqueues ClassifyTicketJob' do
        result
        expect(Ai::ClassifyTicketJob).to have_received(:perform_later).with(result.data.id)
      end

      it 'records a created activity' do
        expect { result }.to change(TicketActivity, :count).by(1)
        expect(result.data.activities.first.action).to eq(TicketActivity::CREATED)
      end

      it 'generates distinct ticket numbers for concurrent tickets' do
        r1 = described_class.call(workspace: workspace, user: user, params: valid_params)
        r2 = described_class.call(workspace: workspace, user: user, params: valid_params)
        expect(r1.data.ticket_number).not_to eq(r2.data.ticket_number)
      end

      it 'stays in sync when tickets were inserted directly without using the sequence' do
        create(:ticket, workspace: workspace, department: department, created_by: user,
                        ticket_number: 'TK-00050')

        result = described_class.call(workspace: workspace, user: user, params: valid_params)

        expect(result).to be_success
        expect(result.data.ticket_number).to eq('TK-00051')
      end
    end

    context 'with invalid params' do
      it 'returns failure when title is missing' do
        result = described_class.call(workspace: workspace, user: user,
                                      params: valid_params.merge(title: ''))
        expect(result).to be_failure
        expect(result.error).to include('Title')
      end

      it 'does not enqueue ClassifyTicketJob on failure' do
        described_class.call(workspace: workspace, user: user, params: { title: '' })
        expect(Ai::ClassifyTicketJob).not_to have_received(:perform_later)
      end
    end
  end
end
