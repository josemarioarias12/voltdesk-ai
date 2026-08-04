# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Providers::OpenaiAdapter do
  describe '#list_model_ids' do
    subject(:list_model_ids) { described_class.new.list_model_ids }

    let(:fake_client) { instance_double(OpenAI::Client, models: models_resource) }
    let(:models_resource) { instance_double(OpenAI::Models, list: response) }

    before do
      allow(OpenAI::Client).to receive(:new).and_return(fake_client)
    end

    context 'when OpenAI returns a list of models' do
      let(:response) do
        { 'data' => [{ 'id' => 'gpt-4o' }, { 'id' => 'gpt-4o-mini' }, { 'id' => 'gpt-5.2' }] }
      end

      it 'returns the model ids as an array of strings' do
        expect(list_model_ids).to eq(%w[gpt-4o gpt-4o-mini gpt-5.2])
      end
    end

    context 'when the data list is empty' do
      let(:response) { { 'data' => [] } }

      it 'returns an empty array' do
        expect(list_model_ids).to eq([])
      end
    end
  end

  describe '#chat' do
    subject(:chat) { described_class.new.chat(prompt: 'Hello', system: 'You are helpful') }

    let(:fake_client) { instance_double(OpenAI::Client, chat: response) }

    before do
      allow(OpenAI::Client).to receive(:new).and_return(fake_client)
    end

    context 'when OpenAI returns a successful response' do
      let(:response) do
        {
          'choices' => [{ 'message' => { 'content' => 'Hi there' } }],
          'usage' => { 'prompt_tokens' => 10, 'completion_tokens' => 5, 'total_tokens' => 15 }
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
      let(:response) { { 'choices' => [{ 'message' => { 'content' => 'Hi' } }] } }

      it 'defaults token counts to zero' do
        expect(chat[:tokens]).to eq('prompt_tokens' => 0, 'completion_tokens' => 0, 'total_tokens' => 0)
      end
    end
  end

  describe '#chat_with_tools' do
    subject(:chat_with_tools) do
      described_class.new.chat_with_tools(
        messages: [{ role: 'user', content: 'What tickets are open?' }],
        tools: [{ type: 'function', function: { name: 'tickets_overview' } }],
        system: 'You are helpful'
      )
    end

    let(:fake_client) { instance_double(OpenAI::Client, chat: response) }

    before do
      allow(OpenAI::Client).to receive(:new).and_return(fake_client)
    end

    context 'when the model calls a tool' do
      let(:response) do
        {
          'choices' => [{
            'message' => {
              'content' => nil,
              'tool_calls' => [{
                'id' => 'call_123',
                'function' => { 'name' => 'tickets_overview', 'arguments' => '{"status":"open"}' }
              }]
            },
            'finish_reason' => 'tool_calls'
          }],
          'usage' => { 'prompt_tokens' => 20, 'completion_tokens' => 10, 'total_tokens' => 30 }
        }
      end

      it 'parses the tool call name and arguments' do
        expect(chat_with_tools[:tool_calls]).to eq(
          [{ id: 'call_123', name: 'tickets_overview', arguments: { 'status' => 'open' } }]
        )
      end

      it 'marks the stop reason as tool_use' do
        expect(chat_with_tools[:stop_reason]).to eq(:tool_use)
      end
    end

    context 'when the model answers directly without calling a tool' do
      let(:response) do
        {
          'choices' => [{
            'message' => { 'content' => 'You have 3 open tickets.', 'tool_calls' => nil },
            'finish_reason' => 'stop'
          }],
          'usage' => { 'prompt_tokens' => 15, 'completion_tokens' => 8, 'total_tokens' => 23 }
        }
      end

      it 'returns an empty tool_calls array and end_turn stop reason' do
        expect(chat_with_tools[:tool_calls]).to eq([])
        expect(chat_with_tools[:stop_reason]).to eq(:end_turn)
      end
    end

    context 'when the tool arguments are malformed JSON' do
      let(:response) do
        {
          'choices' => [{
            'message' => {
              'content' => nil,
              'tool_calls' => [{
                'id' => 'call_456',
                'function' => { 'name' => 'tickets_overview', 'arguments' => 'not json' }
              }]
            },
            'finish_reason' => 'tool_calls'
          }],
          'usage' => {}
        }
      end

      it 'logs the error and returns empty arguments instead of raising' do
        expect(Rails.logger).to receive(:error).with(/Failed to parse tool arguments/)
        expect(chat_with_tools[:tool_calls]).to eq(
          [{ id: 'call_456', name: 'tickets_overview', arguments: {} }]
        )
      end
    end
  end

  describe '#embed' do
    subject(:embed) { described_class.new.embed(text: 'ticket about login issue') }

    let(:fake_client) { instance_double(OpenAI::Client, embeddings: response) }

    before do
      allow(OpenAI::Client).to receive(:new).and_return(fake_client)
    end

    context 'when OpenAI returns a valid embedding' do
      let(:response) do
        {
          'data' => [{ 'embedding' => Array.new(1536) { 0.1 } }],
          'usage' => { 'prompt_tokens' => 5, 'total_tokens' => 5 }
        }
      end

      it 'returns the vector and token usage' do
        result = embed
        expect(result[:vector].length).to eq(1536)
        expect(result[:tokens]).to eq('prompt_tokens' => 5, 'completion_tokens' => 0, 'total_tokens' => 5)
      end
    end

    context 'when OpenAI returns an empty embedding' do
      let(:response) { { 'data' => [{ 'embedding' => [] }], 'usage' => {} } }

      it 'raises an error' do
        expect { embed }.to raise_error('Empty embedding from OpenAI')
      end
    end

    context 'when OpenAI returns the wrong number of dimensions' do
      let(:response) { { 'data' => [{ 'embedding' => [0.1, 0.2] }], 'usage' => {} } }

      it 'raises a dimension mismatch error' do
        expect { embed }.to raise_error('Expected 1536 dims, got 2')
      end
    end
  end
end
