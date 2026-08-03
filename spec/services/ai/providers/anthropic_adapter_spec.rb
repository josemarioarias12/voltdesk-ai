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
end
