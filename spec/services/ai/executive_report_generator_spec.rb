# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::ExecutiveReportGenerator do
  let(:workspace) { create(:workspace) }

  before do
    stub_request(:post, 'https://api.openai.com/v1/chat/completions')
      .to_return(
        status: 200,
        body: {
          choices: [{ message: { content: 'This week operations performed well across all departments.' } }],
          usage: { prompt_tokens: 300, completion_tokens: 250, total_tokens: 550 }
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  describe '.call' do
    it 'returns success with report text' do
      result = described_class.call(workspace: workspace)
      expect(result).to be_success
      expect(result.data).to be_a(String)
      expect(result.data).to be_present
    end

    it 'stores the report in workspace settings' do
      described_class.call(workspace: workspace)
      workspace.reload
      report = workspace.settings['last_executive_report']
      expect(report).to be_present
      expect(report['text']).to be_present
      expect(report['generated_at']).to be_present
      expect(report['metrics']).to be_present
    end

    it 'creates an AiAuditLog entry' do
      expect do
        described_class.call(workspace: workspace)
      end.to change(AiAuditLog, :count).by(1)
    end

    it 'logs the correct operation' do
      described_class.call(workspace: workspace)
      log = AiAuditLog.last
      expect(log.operation).to eq('executive_report')
      expect(log.workspace).to eq(workspace)
      expect(log.status).to eq('success')
    end

    it 'logs token usage' do
      described_class.call(workspace: workspace)
      log = AiAuditLog.last
      expect(log.prompt_tokens).to eq(300)
      expect(log.completion_tokens).to eq(250)
      expect(log.total_tokens).to eq(550)
    end

    context 'when OpenAI fails' do
      before do
        stub_request(:post, 'https://api.openai.com/v1/chat/completions')
          .to_raise(Faraday::TimeoutError)
      end

      it 'returns failure' do
        result = described_class.call(workspace: workspace)
        expect(result).to be_failure
      end
    end
  end
end
