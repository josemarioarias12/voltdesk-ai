# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Tickets::BulkUpdate do
  let(:workspace) { create(:workspace) }
  let(:admin)     { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee)  { create(:user, workspace: workspace, role: :employee) }
  let(:agent)     { create(:user, workspace: workspace, role: :agent) }
  let!(:first_ticket) { create(:ticket, workspace: workspace, created_by: employee, status: :in_progress, priority: :low) }
  let!(:second_ticket) { create(:ticket, workspace: workspace, created_by: employee, status: :in_progress, priority: :low) }

  describe '.call' do
    context 'with an unknown action' do
      it 'returns failure' do
        result = described_class.call(workspace: workspace, user: admin, ticket_ids: [first_ticket.id], action: 'delete_all')
        expect(result).to be_failure
        expect(result.error).to include('Unknown action')
      end
    end

    context 'with no ticket_ids' do
      it 'returns failure' do
        result = described_class.call(workspace: workspace, user: admin, ticket_ids: [], action: 'resolve')
        expect(result).to be_failure
        expect(result.error).to eq('No tickets selected')
      end
    end

    context 'with assign action missing a value' do
      it 'returns failure' do
        result = described_class.call(workspace: workspace, user: admin, ticket_ids: [first_ticket.id], action: 'assign', value: nil)
        expect(result).to be_failure
        expect(result.error).to include('Missing value')
      end
    end

    context 'resolve action as workspace_admin' do
      it 'resolves all selected tickets' do
        result = described_class.call(workspace: workspace, user: admin, ticket_ids: [first_ticket.id, second_ticket.id], action: 'resolve')
        expect(result).to be_success
        expect(result.data[:updated_count]).to eq(2)
        expect(result.data[:skipped_count]).to eq(0)
        expect(first_ticket.reload).to be_status_resolved
        expect(second_ticket.reload).to be_status_resolved
      end
    end

    context 'resolve action as employee (not authorized)' do
      it 'skips all tickets and updates none' do
        result = described_class.call(workspace: workspace, user: employee, ticket_ids: [first_ticket.id, second_ticket.id], action: 'resolve')
        expect(result).to be_success
        expect(result.data[:updated_count]).to eq(0)
        expect(result.data[:skipped_count]).to eq(2)
        expect(first_ticket.reload).not_to be_status_resolved
      end
    end

    context 'assign action as workspace_admin' do
      it 'assigns tickets to the given user' do
        result = described_class.call(workspace: workspace, user: admin, ticket_ids: [first_ticket.id], action: 'assign', value: agent.id)
        expect(result).to be_success
        expect(result.data[:updated_count]).to eq(1)
        expect(first_ticket.reload.assigned_to_id).to eq(agent.id)
      end
    end

    context 'priority action as workspace_admin' do
      it 'updates priority on all selected tickets' do
        result = described_class.call(workspace: workspace, user: admin, ticket_ids: [first_ticket.id, second_ticket.id], action: 'priority', value: 'critical')
        expect(result).to be_success
        expect(first_ticket.reload).to be_priority_critical
        expect(second_ticket.reload).to be_priority_critical
      end
    end

    context 'with tickets from another workspace mixed in' do
      it 'only updates tickets belonging to the given workspace' do
        other_workspace = create(:workspace)
        other_employee  = create(:user, workspace: other_workspace, role: :employee)
        foreign_ticket  = create(:ticket, workspace: other_workspace, created_by: other_employee, status: :in_progress)

        result = described_class.call(
          workspace: workspace, user: admin,
          ticket_ids: [first_ticket.id, foreign_ticket.id], action: 'resolve'
        )

        expect(result.data[:updated_count]).to eq(1)
        expect(foreign_ticket.reload).not_to be_status_resolved
      end
    end
  end
end
