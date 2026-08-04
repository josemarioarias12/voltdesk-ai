# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Providers::GeminiAdapter do
  describe '#list_model_ids' do
    subject(:list_model_ids) { described_class.new.list_model_ids }

    let(:fake_client) { instance_double(Gemini::Controllers::Client, models: response) }

    before do
      allow(Gemini).to receive(:new).and_return(fake_client)
    end

    context 'when Gemini returns a list of models' do
      let(:response) do
        { 'models' => [{ 'name' => 'models/gemini-2.0-flash' }, { 'name' => 'models/gemini-2.5-pro' }] }
      end

      it 'returns the model ids with the models/ prefix stripped' do
        expect(list_model_ids).to eq(%w[gemini-2.0-flash gemini-2.5-pro])
      end
    end

    context 'when the models list is empty' do
      let(:response) { { 'models' => [] } }

      it 'returns an empty array' do
        expect(list_model_ids).to eq([])
      end
    end
  end

  describe '#chat' do
    subject(:chat) { described_class.new.chat(prompt: 'Hello', system: 'You are helpful') }

    let(:fake_client) { instance_double(Gemini::Controllers::Client, generate_content: response) }

    before do
      allow(Gemini).to receive(:new).and_return(fake_client)
    end

    context 'when Gemini returns a successful response' do
      let(:response) do
        {
          'candidates' => [{ 'content' => { 'parts' => [{ 'text' => 'Hi there' }] } }],
          'usageMetadata' => {
            'promptTokenCount' => 10,
            'candidatesTokenCount' => 5,
            'totalTokenCount' => 15
          }
        }
      end

      it 'returns the content and token usage' do
        expect(chat).to eq(
          content: 'Hi there',
          tokens: { 'prompt_tokens' => 10, 'completion_tokens' => 5, 'total_tokens' => 15 }
        )
      end
    end

    context 'when usageMetadata is missing from the response' do
      let(:response) do
        { 'candidates' => [{ 'content' => { 'parts' => [{ 'text' => 'Hi' }] } }] }
      end

      it 'defaults token counts to zero' do
        expect(chat[:tokens]).to eq('prompt_tokens' => 0, 'completion_tokens' => 0, 'total_tokens' => 0)
      end
    end
  end

  describe '#embed' do
    it 'raises NotImplementedError, since Gemini embeddings are incompatible with the pgvector index' do
      expect { described_class.new.embed(text: 'anything') }.to raise_error(
        NotImplementedError, /Gemini embeddings are 768-dim/
      )
    end
  end
end
