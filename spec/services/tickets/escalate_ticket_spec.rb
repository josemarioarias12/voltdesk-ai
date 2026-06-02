# frozen_string_literal: true

require "rails_helper"

RSpec.describe Tickets::EscalateTicket do
  let(:workspace) { create(:workspace) }
  let(:ticket)    { create(:ticket, workspace: workspace, priority: :medium, status: :in_progress) }

  describe ".call" do
    it "escalates priority to critical" do
      result = described_class.call(ticket: ticket)
      expect(result).to be_success
      expect(ticket.reload.priority).to eq("critical")
    end

    it "records an escalated activity with sla_breach reason" do
      expect { described_class.call(ticket: ticket) }.to change(TicketActivity, :count).by(1)
      expect(ticket.activities.last.action).to eq(TicketActivity::ESCALATED)
      expect(ticket.activities.last.metadata["reason"]).to eq("sla_breach")
    end

    context "when already critical" do
      let(:ticket) { create(:ticket, workspace: workspace, priority: :critical) }

      it "returns failure" do
        expect(described_class.call(ticket: ticket)).to be_failure
      end
    end

    context "when already resolved" do
      let(:ticket) { create(:ticket, workspace: workspace, status: :resolved) }

      it "returns failure" do
        expect(described_class.call(ticket: ticket)).to be_failure
      end
    end
  end
end
