# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TicketMailer do
  let(:workspace) { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:created_by) { create(:user, workspace: workspace) }

  describe '#confirmation' do
    let(:ticket) do
      create(:ticket, workspace: workspace, department: department, created_by: created_by,
                       title: 'VPN not connecting', priority: :high)
    end
    let(:mail) { described_class.confirmation(ticket) }

    it 'is sent to the ticket creator' do
      expect(mail.to).to eq([created_by.email])
    end

    it 'includes the ticket number in the subject' do
      expect(mail.subject).to include(ticket.ticket_number)
    end

    it 'renders the ticket title in the html body' do
      expect(mail.html_part.body.to_s).to include('VPN not connecting')
    end

    it 'renders the ticket title in the text body' do
      expect(mail.text_part.body.to_s).to include('VPN not connecting')
    end

    it 'does not include any emoji characters' do
      expect(mail.html_part.body.to_s).not_to match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/)
    end
  end

  describe '#assignment' do
    let(:agent) { create(:user, :agent, workspace: workspace, department: department) }
    let(:ticket) do
      create(:ticket, workspace: workspace, department: department, created_by: created_by,
                       assigned_to: agent, category: :it, priority: :critical, urgency_score: 92,
                       due_at: 4.hours.from_now)
    end
    let(:mail) { described_class.assignment(ticket) }

    it 'is sent to the assigned agent' do
      expect(mail.to).to eq([agent.email])
    end

    it 'includes the ticket number in the subject' do
      expect(mail.subject).to include(ticket.ticket_number)
    end

    it 'renders the urgency score in the html body' do
      expect(mail.html_part.body.to_s).to include('92/100')
    end

    it 'renders the SLA due date banner when due_at is present' do
      expect(mail.html_part.body.to_s).to include('SLA Due Date')
    end

    it 'omits the SLA banner when due_at is blank' do
      ticket.update_column(:due_at, nil)
      expect(described_class.assignment(ticket).html_part.body.to_s).not_to include('SLA Due Date')
    end
  end

  describe '#resolution' do
    let(:ticket) do
      ticket = create(:ticket, workspace: workspace, department: department, created_by: created_by,
                                created_at: 3.hours.ago)
      ticket.update_columns(status: Ticket.statuses[:resolved], resolved_at: Time.current)
      ticket
    end
    let(:mail) { described_class.resolution(ticket) }

    it 'is sent to the ticket creator' do
      expect(mail.to).to eq([created_by.email])
    end

    it 'includes the ticket number in the subject' do
      expect(mail.subject).to include(ticket.ticket_number)
    end

    it 'renders a human readable resolution time' do
      expect(mail.html_part.body.to_s).to match(/about 3 hours|3 hours/)
    end
  end
end
