# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::ExplainDecision do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:admin)      { create(:user, workspace: workspace, role: :workspace_admin) }

  let(:ai_metadata) do
    {
      'category' => 'billing',
      'priority' => 'high',
      'urgency_score' => 72,
      'reasoning' => { 'category_signals' => ['invoice mentioned'], 'confidence' => 0.81 },
      'tags' => ['invoice'],
      'model' => 'gpt-4o',
      'provider' => 'openai'
    }
  end

  describe '.visible_to?' do
    it 'is visible to every role except guest' do
      %i[super_admin workspace_admin hr_manager it_manager facilities_manager
         operations_manager department_manager agent employee].each do |role|
        expect(described_class.visible_to?(build(:user, role: role))).to be(true)
      end

      expect(described_class.visible_to?(build(:user, role: :guest))).to be(false)
    end
  end

  describe '#call' do
    subject(:tool) { described_class.new(user: admin, workspace: workspace, locale: 'en') }

    it 'fails when the ticket does not exist in this workspace' do
      result = tool.call(ticket_number: 'TK-99999')

      expect(result).to be_failure
      expect(result.error).to include('No ticket found')
    end

    it 'fails when the current user is not authorized to view the ticket' do
      other_workspace_user = create(:user, workspace: create(:workspace), role: :employee)
      ticket = create(:ticket, workspace: workspace, department: department, ai_metadata: ai_metadata)

      result = described_class.new(user: other_workspace_user, workspace: workspace, locale: 'en')
                              .call(ticket_number: ticket.ticket_number)

      expect(result).to be_failure
      expect(result.error).to include('do not have access')
    end

    it 'fails when the ticket has not been classified yet' do
      ticket = create(:ticket, workspace: workspace, department: department, ai_metadata: {})

      result = tool.call(ticket_number: ticket.ticket_number)

      expect(result).to be_failure
      expect(result.error).to include('not been classified')
    end

    context 'without a matching AiAuditLog entry' do
      it 'returns the classification reasoning with audit_trail_found: false and no cost data' do
        ticket = create(:ticket, workspace: workspace, department: department, ai_metadata: ai_metadata)

        result = tool.call(ticket_number: ticket.ticket_number)

        expect(result).to be_success
        expect(result.data[:category]).to eq('billing')
        expect(result.data[:urgency_score]).to eq(72)
        expect(result.data[:audit_trail_found]).to be(false)
        expect(result.data[:audit_trail]).to be_nil
      end
    end

    context 'with a matching AiAuditLog entry' do
      it 'enriches the response with cost, tokens, and duration' do
        ticket = create(:ticket, workspace: workspace, department: department, ai_metadata: ai_metadata)
        create(:ai_audit_log,
               workspace: workspace,
               operation: :ticket_classification,
               prompt: "Ticket ##{ticket.ticket_number}\nTitle: #{ticket.title}\n",
               prompt_tokens: 100,
               completion_tokens: 50,
               total_tokens: 150,
               duration_ms: 820)

        result = tool.call(ticket_number: ticket.ticket_number)

        expect(result.data[:audit_trail_found]).to be(true)
        expect(result.data[:audit_trail]).to include(total_tokens: 150, duration_ms: 820)
      end

      it 'never matches an audit log from a different workspace with a colliding ticket_number' do
        other_workspace = create(:workspace)
        create(:ticket, workspace: workspace, department: department,
               ticket_number: 'TK-00001', ai_metadata: ai_metadata)
        create(:ai_audit_log,
               workspace: other_workspace,
               operation: :ticket_classification,
               prompt: "Ticket #TK-00001\nTitle: Some unrelated ticket in another workspace\n")

        result = tool.call(ticket_number: 'TK-00001')

        expect(result.data[:audit_trail_found]).to be(false)
      end
    end
  end
end
