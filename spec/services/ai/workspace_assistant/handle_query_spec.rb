# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::WorkspaceAssistant::HandleQuery do
  subject(:result) do
    described_class.call(conversation: conversation, user: user, workspace: workspace,
                         message: 'How many tickets do I have?', locale: 'en')
  end

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

    it 'links the AiAuditLog entry to the final assistant message' do
      result
      assistant_message = conversation.assistant_messages.role_assistant.last
      expect(AiAuditLog.last.assistant_message).to eq(assistant_message)
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

    it 'links both AiAuditLog entries to the same final assistant message' do
      result
      assistant_message = conversation.assistant_messages.role_assistant.last
      expect(AiAuditLog.last(2).map(&:assistant_message)).to all(eq(assistant_message))
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

  context 'when a tool call returns a report attachment' do
    before do
      allow(adapter).to receive(:chat_with_tools).and_return(
        {
          content: nil,
          tool_calls: [{ id: 'call_1', name: 'generate_report', arguments: { report_type: 'tickets', format: 'csv' } }],
          tokens: {},
          stop_reason: :tool_use
        },
        {
          content: 'Your report is ready for download.',
          tool_calls: [],
          tokens: {},
          stop_reason: :end_turn
        }
      )
      allow(Ai::Tools::Registry).to receive(:find).with('generate_report').and_return(Ai::Tools::GenerateReport)
      allow_any_instance_of(Ai::Tools::GenerateReport).to receive(:call).and_return(
        ServiceResult.success(
          total_records: 3,
          filename: 'tickets_2026-07-27.csv',
          attachment: { filename: 'tickets_2026-07-27.csv', content_type: 'text/csv', data: "a,b
1,2
" }
        )
      )
    end

    it 'attaches the report file to the final assistant message' do
      result
      assistant_message = conversation.assistant_messages.order(:created_at).last
      expect(assistant_message.report_file).to be_attached
      expect(assistant_message.report_file.filename.to_s).to eq('tickets_2026-07-27.csv')
    end

    it 'never sends the binary attachment data back into the conversation history sent to the model' do
      result

      expect(adapter).to have_received(:chat_with_tools).at_least(:once) do |args|
        expect(args[:messages].to_json).not_to include('a,b')
      end
    end

    it 'reports has_attachment as true in the result' do
      expect(result.data[:has_attachment]).to be(true)
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

    it 'leaves AiAuditLog entries unlinked when no final assistant message is ever created' do
      result
      expect(AiAuditLog.all).to all(have_attributes(assistant_message_id: nil))
    end
  end
end
