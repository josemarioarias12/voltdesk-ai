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
end
