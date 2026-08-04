# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Providers::AnthropicAdapter do
  describe '#list_model_ids' do
    subject(:list_model_ids) { described_class.new.list_model_ids }

    let(:url) { 'https://api.anthropic.com/v1/models' }

    context 'when Anthropic returns a list of models' do
      before do
        stub_request(:get, url).to_return(
          status: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: { data: [{ id: 'claude-sonnet-5' }, { id: 'claude-haiku-4-5-20251001' }] }.to_json
        )
      end

      it 'returns the model ids as an array of strings' do
        expect(list_model_ids).to eq(%w[claude-sonnet-5 claude-haiku-4-5-20251001])
      end

      it 'sends the correct anthropic-version header' do
        list_model_ids
        expect(WebMock).to have_requested(:get, url).with(headers: { 'anthropic-version' => '2023-06-01' })
      end
    end

    context 'when Anthropic returns a non-success response' do
      before { stub_request(:get, url).to_return(status: 401, body: '{}') }

      it 'returns an empty array' do
        expect(list_model_ids).to eq([])
      end
    end

    context 'when the request times out' do
      before { stub_request(:get, url).to_timeout }

      it 'raises, letting the caller decide how to handle it' do
        expect { list_model_ids }.to raise_error(Net::OpenTimeout)
      end
    end
  end

  describe '#chat' do
    subject(:chat) { described_class.new.chat(prompt: 'Hello', system: 'You are helpful') }

    let(:fake_client) { instance_double(Anthropic::Client, messages: response) }

    before do
      allow(Anthropic::Client).to receive(:new).and_return(fake_client)
    end

    context 'when Anthropic returns a successful response' do
      let(:response) do
        {
          'content' => [{ 'type' => 'text', 'text' => 'Hi there' }],
          'usage' => { 'input_tokens' => 10, 'output_tokens' => 5 }
        }
      end

      it 'returns the content and token usage' do
        expect(chat).to eq(
          content: 'Hi there',
          tokens: { 'prompt_tokens' => 10, 'completion_tokens' => 5, 'total_tokens' => 15 }
        )
      end
    end

    context 'when usage is missing from the response' do
      let(:response) { { 'content' => [{ 'type' => 'text', 'text' => 'Hi' }] } }

      it 'defaults token counts to zero' do
        expect(chat[:tokens]).to eq('prompt_tokens' => 0, 'completion_tokens' => 0, 'total_tokens' => 0)
      end
    end
  end

  describe '#chat_with_tools' do
    subject(:chat_with_tools) do
      described_class.new.chat_with_tools(
        messages: [{ role: 'user', content: 'What tickets are open?' }],
        tools: [{ name: 'tickets_overview' }],
        system: 'You are helpful'
      )
    end

    let(:fake_client) { instance_double(Anthropic::Client, messages: response) }

    before do
      allow(Anthropic::Client).to receive(:new).and_return(fake_client)
    end

    context 'when the model only calls a tool, no text' do
      let(:response) do
        {
          'content' => [
            { 'type' => 'tool_use', 'id' => 'toolu_1', 'name' => 'tickets_overview', 'input' => { 'status' => 'open' } }
          ],
          'usage' => { 'input_tokens' => 20, 'output_tokens' => 10 },
          'stop_reason' => 'tool_use'
        }
      end

      it 'returns nil content and the parsed tool call' do
        expect(chat_with_tools[:content]).to be_nil
        expect(chat_with_tools[:tool_calls]).to eq(
          [{ id: 'toolu_1', name: 'tickets_overview', arguments: { 'status' => 'open' } }]
        )
      end

      it 'marks the stop reason as tool_use' do
        expect(chat_with_tools[:stop_reason]).to eq(:tool_use)
      end
    end

    context 'when the model returns both a text block and a tool_use block' do
      let(:response) do
        {
          'content' => [
            { 'type' => 'text', 'text' => 'Let me check that.' },
            { 'type' => 'tool_use', 'id' => 'toolu_2', 'name' => 'tickets_overview', 'input' => {} }
          ],
          'usage' => { 'input_tokens' => 25, 'output_tokens' => 12 },
          'stop_reason' => 'tool_use'
        }
      end

      it 'returns both the text content and the tool call' do
        expect(chat_with_tools[:content]).to eq('Let me check that.')
        expect(chat_with_tools[:tool_calls]).to eq(
          [{ id: 'toolu_2', name: 'tickets_overview', arguments: {} }]
        )
      end
    end

    context 'when the model answers directly without calling a tool' do
      let(:response) do
        {
          'content' => [{ 'type' => 'text', 'text' => 'You have 3 open tickets.' }],
          'usage' => { 'input_tokens' => 15, 'output_tokens' => 8 },
          'stop_reason' => 'end_turn'
        }
      end

      it 'returns an empty tool_calls array and end_turn stop reason' do
        expect(chat_with_tools[:tool_calls]).to eq([])
        expect(chat_with_tools[:stop_reason]).to eq(:end_turn)
      end
    end
  end

  describe '#embed' do
    it 'raises NotImplementedError, since Anthropic has no embeddings API' do
      expect { described_class.new.embed(text: 'anything') }.to raise_error(
        NotImplementedError, 'Anthropic does not provide embeddings. Use OpenAI adapter.'
      )
    end
  end
end
