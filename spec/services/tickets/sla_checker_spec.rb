# frozen_string_literal: true

require "rails_helper"

RSpec.describe Tickets::SlaChecker do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }

  describe ".call" do
    context "when ticket has no due_at" do
      let(:ticket) { create(:ticket, workspace: workspace, department: department, due_at: nil) }

      it "skips without error" do
        result = described_class.call(ticket: ticket)
        expect(result).to be_success
        expect(result.data).to eq(:skip_no_due_at)
      end
    end

    context "when ticket is resolved" do
      let(:ticket) { create(:ticket, workspace: workspace, department: department, status: :resolved, due_at: 1.hour.ago) }

      it "skips without escalating" do
        expect(Tickets::EscalateTicket).not_to receive(:call)
        result = described_class.call(ticket: ticket)
        expect(result.data).to eq(:skip_resolved)
      end
    end

    context "when SLA is at risk (< 30 min remaining)" do
      let(:ticket) { create(:ticket, workspace: workspace, department: department, due_at: 20.minutes.from_now, status: :open) }

      it "sends a warning" do
        expect { described_class.call(ticket: ticket) }.to change(TicketActivity, :count).by(1)
        expect(ticket.activities.last.action).to eq(TicketActivity::SLA_WARNING)
      end

      it "does not send a second warning" do
        described_class.call(ticket: ticket)
        expect { described_class.call(ticket: ticket) }.not_to change(TicketActivity, :count)
      end
    end

    context "when SLA is breached" do
      let(:ticket) { create(:ticket, workspace: workspace, department: department, due_at: 2.hours.ago, status: :open, priority: :medium) }

      it "escalates the ticket to critical" do
        allow(Tickets::EscalateTicket).to receive(:call).and_return(ServiceResult.success(ticket))
        described_class.call(ticket: ticket)
        expect(Tickets::EscalateTicket).to have_received(:call).with(ticket: ticket)
      end
    end
  end
end
