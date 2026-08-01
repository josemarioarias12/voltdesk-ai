# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::WorkspaceLearner do
  let!(:workspace) { create(:workspace) }
  let!(:dept)      { create(:department, workspace: workspace) }
  let(:adapter)    { instance_double(Ai::Providers::OpenaiAdapter) }
  let(:model)      { 'gpt-4o' }
  let(:provider)   { 'openai' }
  let(:router)     { instance_double(Ai::ModelRouter) }

  let(:valid_ai_response) do
    JSON.generate({
                    summary: 'Billing tickets are often mislabeled as technical_support',
      suggested_prompt_addition: 'If the issue involves payment or invoices, classify as billing.',
      correction_patterns: [{ from: 'billing', to: 'technical_support', count: 30, pct: 60.0 }],
      confidence: 0.85
                  })
  end

  before do
    allow(Ai::ModelRouter).to receive(:for).with(workspace: workspace, operation: :analysis).and_return(router)
    allow(router).to receive(:resolve).and_return([adapter, model, provider])
    allow(adapter).to receive(:chat).and_return(
      content: valid_ai_response,
      tokens: { 'prompt_tokens' => 200, 'completion_tokens' => 80, 'total_tokens' => 280 }
    )
  end

  describe '.call' do
    context 'with fewer than 50 corrections' do
      before { create_list(:classification_correction, 3, workspace: workspace) }

      it 'returns failure with insufficient_data' do
        result = described_class.call(workspace: workspace)
        expect(result.success?).to be false
        expect(result.error).to eq('insufficient_data')
      end
    end

    context 'with 50+ corrections' do
      before do
        ticket = create(:ticket, workspace: workspace, department: dept,
                        ai_metadata: { 'category' => 'billing' })
        agent  = create(:user, workspace: workspace)
        create_list(:classification_correction, 50, workspace: workspace, ticket: ticket, agent: agent)
      end

      it 'calls the AI adapter' do
        described_class.call(workspace: workspace)
        expect(adapter).to have_received(:chat)
      end

      it 'returns success with parsed result' do
        result = described_class.call(workspace: workspace)
        expect(result.success?).to be true
        expect(result.data['summary']).to be_present
      end

      it 'saves learning_suggestion to workspace settings' do
        described_class.call(workspace: workspace)
        workspace.reload
        expect(workspace.settings['learning_suggestion']).to be_present
        expect(workspace.settings['learning_suggestion']['generated_at']).to be_present
        expect(workspace.settings['learning_suggestion']['corrections_before_apply']).to eq(50)
      end

      it 'broadcasts learning_suggestion_ready via ActionCable' do
        expect(ActionCable.server).to receive(:broadcast).with(
          "workspace_admin:#{workspace.id}",
          hash_including(event: 'learning_suggestion_ready')
        )
        described_class.call(workspace: workspace)
      end
    end

    context 'when AI returns invalid JSON' do
      before do
        ticket = create(:ticket, workspace: workspace, department: dept,
                        ai_metadata: { 'category' => 'billing' })
        agent  = create(:user, workspace: workspace)
        create_list(:classification_correction, 50, workspace: workspace, ticket: ticket, agent: agent)
        allow(adapter).to receive(:chat).and_return(
          content: 'not valid json {{{',
          tokens: { 'prompt_tokens' => 200, 'completion_tokens' => 80, 'total_tokens' => 280 }
        )
      end

      it 'returns failure with invalid_ai_response' do
        result = described_class.call(workspace: workspace)
        expect(result.success?).to be false
        expect(result.error).to eq('invalid_ai_response')
      end
    end
  end
end
