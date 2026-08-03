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
end
