# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::WorkspaceAssistant::HandleQuery do
  let(:workspace)    { create(:workspace) }
  let(:department)   { create(:department, workspace: workspace) }
  let(:user)         { create(:user, workspace: workspace, department: department, role: :employee) }
  let(:conversation) { create(:assistant_conversation, workspace: workspace, user: user) }
  let(:adapter)      { instance_double(Ai::Providers::OpenaiAdapter) }

  before do
    allow(Ai::ModelRouter).to receive(:for)
      .with(workspace: workspace, operation: :workspace_assistant_query)
      .and_return(instance_double(Ai::ModelRouter, resolve: [adapter, 'gpt-4o', 'openai']))
  end

  subject(:result) do
    described_class.call(conversation: conversation, user: user, workspace: workspace,
                          message: 'How many tickets do I have?', locale: 'en')
  end

  context 'when the model answers without calling a tool' do
    before do
      allow(adapter).to receive(:chat_with_tools).and_return(
        content: 'I need more context to answer that.',
        tool_calls: [],
        tokens: { 'prompt_tokens' => 10, 'completion_tokens' => 5, 'total_tokens' => 15 },
        stop_reason: :end_turn
      )
    end

    it 'returns success with the final content' do
      expect(result).to be_success
      expect(result.data[:content]).to eq('I need more context to answer that.')
    end

    it 'persists the user and assistant messages, in order' do
      result
      expect(conversation.assistant_messages.order(:created_at).pluck(:role)).to eq(%w[user assistant])
    end

    it 'writes exactly one AiAuditLog entry' do
      expect { result }.to change(AiAuditLog, :count).by(1)
    end
  end

  context 'when the model calls one tool before answering' do
    before do
      allow(adapter).to receive(:chat_with_tools).and_return(
        {
          content: nil,
          tool_calls: [{ id: 'call_1', name: 'my_tickets', arguments: {} }],
          tokens: { 'prompt_tokens' => 10, 'completion_tokens' => 5, 'total_tokens' => 15 },
          stop_reason: :tool_use
        },
        {
          content: 'You have 2 open tickets.',
          tool_calls: [],
          tokens: { 'prompt_tokens' => 20, 'completion_tokens' => 8, 'total_tokens' => 28 },
          stop_reason: :end_turn
        }
      )
      create(:ticket, workspace: workspace, department: department, created_by: user, status: :open)
      create(:ticket, workspace: workspace, department: department, created_by: user, status: :open)
    end

    it 'returns the final content after the tool round-trip' do
      expect(result).to be_success
      expect(result.data[:content]).to eq('You have 2 open tickets.')
    end

    it 'records which tool was used' do
      expect(result.data[:tools_used]).to eq(['my_tickets'])
    end

    it 'writes one AiAuditLog entry per model call, not per turn' do
      expect { result }.to change(AiAuditLog, :count).by(2)
    end
  end

  context 'when the model calls a tool not visible to the user role' do
    before do
      allow(adapter).to receive(:chat_with_tools).and_return(
        { content: nil, tool_calls: [{ id: 'call_1', name: 'department_tickets', arguments: {} }],
          tokens: {}, stop_reason: :tool_use },
        { content: "I don't have access to that information.", tool_calls: [], tokens: {}, stop_reason: :end_turn }
      )
    end

    it 'does not raise, and lets the model respond instead of executing the tool' do
      expect(result).to be_success
      expect(result.data[:content]).to eq("I don't have access to that information.")
    end
  end

  context 'when the model keeps requesting tools past the safety limit' do
    before do
      allow(adapter).to receive(:chat_with_tools).and_return(
        content: nil,
        tool_calls: [{ id: 'call_1', name: 'my_tickets', arguments: {} }],
        tokens: {},
        stop_reason: :tool_use
      )
    end

    it 'returns failure instead of looping forever' do
      expect(result).to be_failure
    end
  end
end
