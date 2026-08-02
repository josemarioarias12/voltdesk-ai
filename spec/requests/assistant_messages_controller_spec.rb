# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AssistantMessagesController, type: :request do
  let(:workspace)       { create(:workspace) }
  let(:department)      { create(:department, workspace: workspace) }
  let(:workspace_admin) { create(:user, workspace: workspace, department: department, role: :workspace_admin) }
  let(:employee)        { create(:user, workspace: workspace, department: department, role: :employee) }
  let(:adapter)         { instance_double(Ai::Providers::OpenaiAdapter) }

  before do
    allow(Ai::ModelRouter).to receive(:for)
      .with(workspace: workspace, operation: :workspace_assistant_query)
      .and_return(instance_double(Ai::ModelRouter, resolve: [adapter, 'gpt-4o', 'openai']))
    allow(adapter).to receive(:chat_with_tools).and_return(
      content: 'You have 2 open tickets.',
      tool_calls: [],
      tokens: { 'prompt_tokens' => 10, 'completion_tokens' => 5, 'total_tokens' => 15 },
      stop_reason: :end_turn
    )
  end

  describe 'POST /assistant/messages' do
    context 'when the user is a workspace_admin' do
      before { sign_in workspace_admin }

      it 'includes audit_trace in the JSON response' do
        post assistant_messages_path, params: { content: 'How many tickets do I have?' }, headers: inertia_headers
        json = response.parsed_body
        expect(json['audit_trace']).to be_present
        expect(json['audit_trace']['assistant_message_id']).to be_present
      end
    end

    context 'when the user is an employee' do
      before { sign_in employee }

      it 'does not include audit_trace in the JSON response' do
        post assistant_messages_path, params: { content: 'How many tickets do I have?' }, headers: inertia_headers
        json = response.parsed_body
        expect(json['audit_trace']).to be_nil
      end
    end
  end
end
