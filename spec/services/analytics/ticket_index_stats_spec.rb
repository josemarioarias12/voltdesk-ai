# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::TicketIndexStats do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace) }
  let(:scope)     { Ticket.where(workspace: workspace) }

  describe '.call' do
    it 'returns a successful ServiceResult with all expected keys' do
      result = described_class.call(workspace: workspace, scope: scope)
      expect(result).to be_success
      expect(result.data.keys).to contain_exactly(
        :total_open, :in_progress, :pending, :sla_breached,
        :resolved_today, :avg_response_hours, :by_status, :delta
      )
    end

    it 'counts pending tickets correctly instead of hardcoding 0' do
      create_list(:ticket, 3, workspace: workspace, created_by: user, status: :pending)
      create(:ticket, workspace: workspace, created_by: user, status: :open)

      result = described_class.call(workspace: workspace, scope: scope)
      expect(result.data[:pending]).to eq(3)
    end

    it 'derives by_status counts for every status in the enum, not a hardcoded subset' do
      create(:ticket, workspace: workspace, created_by: user, status: :open)
      create_list(:ticket, 2, workspace: workspace, created_by: user, status: :resolved)

      result = described_class.call(workspace: workspace, scope: scope)
      expect(result.data[:by_status].keys).to match_array(Ticket.statuses.keys)
      expect(result.data[:by_status]['open']).to eq(1)
      expect(result.data[:by_status]['resolved']).to eq(2)
      expect(result.data[:by_status]['closed']).to eq(0)
    end

    describe 'avg_response_hours' do
      it 'returns 0.0 when there are no comments' do
        create(:ticket, workspace: workspace, created_by: user, status: :open)

        result = described_class.call(workspace: workspace, scope: scope)
        expect(result.data[:avg_response_hours]).to eq(0.0)
      end

      it 'computes the average hours between ticket creation and first non-internal comment' do
        ticket = create(:ticket, workspace: workspace, created_by: user, status: :open,
                                  created_at: 4.hours.ago)
        create(:ticket_comment, ticket: ticket, user: user, internal: false, created_at: 2.hours.ago)

        result = described_class.call(workspace: workspace, scope: scope)
        expect(result.data[:avg_response_hours]).to eq(2.0)
      end

      it 'ignores internal comments when finding the first response' do
        ticket = create(:ticket, workspace: workspace, created_by: user, status: :open,
                                  created_at: 4.hours.ago)
        create(:ticket_comment, ticket: ticket, user: user, internal: true, created_at: 3.hours.ago)
        create(:ticket_comment, ticket: ticket, user: user, internal: false, created_at: 1.hour.ago)

        result = described_class.call(workspace: workspace, scope: scope)
        expect(result.data[:avg_response_hours]).to eq(3.0)
      end
    end

    describe 'delta' do
      it 'computes sla_breached_critical from real data' do
        create(:ticket, workspace: workspace, created_by: user, status: :open,
                         priority: :critical, due_at: 1.hour.ago)

        result = described_class.call(workspace: workspace, scope: scope)
        expect(result.data[:delta][:sla_breached_critical]).to eq(1)
      end

      it 'computes in_progress_vs_last_week from real status_changed activity metadata' do
        ticket = create(:ticket, workspace: workspace, created_by: user, status: :in_progress)
        create(:ticket_activity, ticket: ticket, action: TicketActivity::STATUS_CHANGED,
                                  metadata: { from: 'open', to: 'in_progress' }, created_at: 1.day.ago)

        result = described_class.call(workspace: workspace, scope: scope)
        expect(result.data[:delta][:in_progress_vs_last_week]).to eq(1)
      end
    end

    it 'returns failure if a query raises an error' do
      allow(scope).to receive(:open_tickets).and_raise(StandardError, 'boom')

      result = described_class.call(workspace: workspace, scope: scope)
      expect(result).to be_failure
      expect(result.error).to eq('boom')
    end
  end
end
