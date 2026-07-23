# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::SlaNotifier do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:ticket) { create(:ticket, workspace: workspace, department: department) }

  describe '.call' do
    context 'when a department_manager exists for the ticket department' do
      let!(:dept_manager) { create(:user, :department_manager, workspace: workspace, department: department) }
      let!(:workspace_admin) { create(:user, :workspace_admin, workspace: workspace) }

      it 'notifies the department manager, not the workspace admin' do
        result = described_class.call(ticket: ticket, probability: 0.85, reasoning: 'High risk.')

        expect(result).to be_success
        expect(result.data[:manager_id]).to eq(dept_manager.id)
      end

      it 'creates a Notification for the department manager' do
        expect { described_class.call(ticket: ticket, probability: 0.85, reasoning: 'High risk.') }
          .to change { Notification.where(user: dept_manager).count }.by(1)
      end
    end

    context 'when no department_manager exists for the ticket department' do
      let!(:workspace_admin) { create(:user, :workspace_admin, workspace: workspace) }

      it 'falls back to the workspace admin' do
        result = described_class.call(ticket: ticket, probability: 0.85, reasoning: 'High risk.')

        expect(result).to be_success
        expect(result.data[:manager_id]).to eq(workspace_admin.id)
      end
    end

    context 'when no manager or workspace_admin exists at all' do
      it 'returns failure' do
        result = described_class.call(ticket: ticket, probability: 0.85, reasoning: 'High risk.')

        expect(result).to be_failure
        expect(result.error).to eq('No manager found for department')
      end
    end

    context 'when a notification was already sent recently' do
      let!(:workspace_admin) { create(:user, :workspace_admin, workspace: workspace) }

      before do
        create(:notification,
               workspace: workspace,
               user: workspace_admin,
               notification_type: :sla_breach_predicted,
               resource: ticket,
               created_at: 30.minutes.ago)
      end

      it 'returns failure without creating a duplicate notification' do
        expect { described_class.call(ticket: ticket, probability: 0.85, reasoning: 'High risk.') }
          .not_to change(Notification, :count)
      end
    end

    context 'when a notification was sent more than 2 hours ago' do
      let!(:workspace_admin) { create(:user, :workspace_admin, workspace: workspace) }

      before do
        create(:notification,
               workspace: workspace,
               user: workspace_admin,
               notification_type: :sla_breach_predicted,
               resource: ticket,
               created_at: 3.hours.ago)
      end

      it 'allows a new notification' do
        expect { described_class.call(ticket: ticket, probability: 0.85, reasoning: 'High risk.') }
          .to change(Notification, :count).by(1)
      end
    end

    context 'broadcast' do
      let!(:workspace_admin) { create(:user, :workspace_admin, workspace: workspace) }

      it 'broadcasts to the manager notifications channel' do
        allow(ActionCable.server).to receive(:broadcast).and_call_original

        described_class.call(ticket: ticket, probability: 0.85, reasoning: 'High risk.')

        expect(ActionCable.server).to have_received(:broadcast).with(
          "notifications_#{workspace_admin.id}",
          hash_including(type: 'sla_breach_predicted', reasoning: 'High risk.')
        )
      end
    end
  end
end
