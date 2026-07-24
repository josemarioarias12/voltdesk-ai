# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Tickets::SendResolutionEmailJob do
  let(:workspace) { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:created_by) { create(:user, workspace: workspace) }

  describe '#perform' do
    context 'when the ticket is resolved' do
      let(:ticket) do
        ticket = create(:ticket, workspace: workspace, department: department, created_by: created_by)
        ticket.update_columns(status: Ticket.statuses[:resolved], resolved_at: Time.current)
        ticket
      end

      it 'sends the email via Resend with the correct recipient' do
        allow(Resend::Emails).to receive(:send).and_return({ id: 'fake-id' })

        described_class.new.perform(ticket.id)

        expect(Resend::Emails).to have_received(:send).with(
          hash_including(to: created_by.email, from: ApplicationMailer::FROM_ADDRESS)
        )
      end
    end

    context 'when the ticket has no resolved_at' do
      let(:ticket) { create(:ticket, workspace: workspace, department: department, created_by: created_by) }

      it 'does not attempt to send an email' do
        allow(Resend::Emails).to receive(:send)

        described_class.new.perform(ticket.id)

        expect(Resend::Emails).not_to have_received(:send)
      end
    end

    context 'when the ticket no longer exists' do
      it 'does not raise' do
        expect { described_class.new.perform(0) }.not_to raise_error
      end
    end

    context 'when Resend raises an error' do
      let(:ticket) do
        ticket = create(:ticket, workspace: workspace, department: department, created_by: created_by)
        ticket.update_columns(status: Ticket.statuses[:resolved], resolved_at: Time.current)
        ticket
      end

      it 're-raises so Sidekiq can retry' do
        allow(Resend::Emails).to receive(:send).and_raise(Resend::Error.new('API down', 500, {}))

        expect { described_class.new.perform(ticket.id) }.to raise_error(Resend::Error)
      end
    end
  end
end
