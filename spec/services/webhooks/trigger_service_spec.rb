# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Webhooks::TriggerService do
  let(:workspace) { create(:workspace) }
  let(:event)     { 'ticket.created' }
  let(:payload)   { { ticket_id: 1, title: 'Test ticket' } }

  describe '.call' do
    context 'when there are active webhooks subscribed to the event' do
      let!(:webhook_one) { create(:webhook, workspace: workspace, events: ['ticket.created']) }
      let!(:webhook_two) { create(:webhook, workspace: workspace, events: ['ticket.created']) }

      it 'enqueues DeliverJob for each subscribed webhook' do
        expect do
          described_class.call(workspace: workspace, event: event, payload: payload)
        end.to have_enqueued_job(Webhooks::DeliverJob)
          .with(webhook_one.id, event, payload)
          .and have_enqueued_job(Webhooks::DeliverJob)
          .with(webhook_two.id, event, payload)
      end

      it 'returns success with enqueued count' do
        result = described_class.call(workspace: workspace, event: event, payload: payload)
        expect(result).to be_success
        expect(result.data).to eq(2)
      end
    end

    context 'when a webhook is subscribed to a different event' do
      let!(:webhook) { create(:webhook, workspace: workspace, events: ['ticket.resolved']) }

      it 'does not enqueue DeliverJob' do
        expect do
          described_class.call(workspace: workspace, event: event, payload: payload)
        end.not_to have_enqueued_job(Webhooks::DeliverJob)
      end

      it 'returns success with 0 enqueued' do
        result = described_class.call(workspace: workspace, event: event, payload: payload)
        expect(result).to be_success
        expect(result.data).to eq(0)
      end
    end

    context 'when a webhook is inactive' do
      let!(:webhook) { create(:webhook, workspace: workspace, events: ['ticket.created'], active: false) }

      it 'does not enqueue DeliverJob for inactive webhook' do
        expect do
          described_class.call(workspace: workspace, event: event, payload: payload)
        end.not_to have_enqueued_job(Webhooks::DeliverJob)
      end
    end

    context 'when there are no webhooks' do
      it 'returns success with 0 enqueued' do
        result = described_class.call(workspace: workspace, event: event, payload: payload)
        expect(result).to be_success
        expect(result.data).to eq(0)
      end
    end

    context 'when webhook belongs to a different workspace' do
      let(:other_workspace) { create(:workspace) }
      let!(:webhook) { create(:webhook, workspace: other_workspace, events: ['ticket.created']) }

      it 'does not enqueue DeliverJob for other workspace webhooks' do
        expect do
          described_class.call(workspace: workspace, event: event, payload: payload)
        end.not_to have_enqueued_job(Webhooks::DeliverJob)
      end
    end
  end
end
