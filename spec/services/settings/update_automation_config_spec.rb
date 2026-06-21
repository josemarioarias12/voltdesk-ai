# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Settings::UpdateAutomationConfig do
  let(:workspace) { create(:workspace, settings: { 'custom_prompt_context' => 'existing context' }) }

  let(:valid_params) do
    {
      agent_urgency_threshold: 70,
      agent_similarity_threshold: 0.8,
      human_in_the_loop: true,
      automatable_categories: %w[it hr]
    }
  end

  describe '.call' do
    it 'returns a successful ServiceResult' do
      result = described_class.call(workspace: workspace, params: valid_params)
      expect(result).to be_success
    end

    it 'persists all four settings keys' do
      described_class.call(workspace: workspace, params: valid_params)
      workspace.reload
      expect(workspace.settings['agent_urgency_threshold']).to eq(70.0)
      expect(workspace.settings['agent_similarity_threshold']).to eq(0.8)
      expect(workspace.settings['human_in_the_loop']).to be(true)
      expect(workspace.settings['automatable_categories']).to eq(%w[it hr])
    end

    it 'preserves unrelated existing settings keys' do
      described_class.call(workspace: workspace, params: valid_params)
      expect(workspace.reload.settings['custom_prompt_context']).to eq('existing context')
    end

    it 'casts human_in_the_loop from a string param (web form submission)' do
      described_class.call(workspace: workspace, params: valid_params.merge(human_in_the_loop: 'false'))
      expect(workspace.reload.settings['human_in_the_loop']).to be(false)
    end

    context 'with an urgency threshold above 100' do
      it 'returns failure' do
        result = described_class.call(workspace: workspace, params: valid_params.merge(agent_urgency_threshold: 150))
        expect(result).to be_failure
        expect(result.error).to include('Urgency threshold')
      end
    end

    context 'with a negative urgency threshold' do
      it 'returns failure' do
        result = described_class.call(workspace: workspace, params: valid_params.merge(agent_urgency_threshold: -5))
        expect(result).to be_failure
      end
    end

    context 'with a similarity threshold above 1' do
      it 'returns failure' do
        result = described_class.call(workspace: workspace, params: valid_params.merge(agent_similarity_threshold: 1.5))
        expect(result).to be_failure
        expect(result.error).to include('Similarity threshold')
      end
    end

    context 'with an invalid category' do
      it 'returns failure listing the invalid category' do
        result = described_class.call(workspace: workspace, params: valid_params.merge(automatable_categories: %w[it not_real]))
        expect(result).to be_failure
        expect(result.error).to include('not_real')
      end
    end

    context 'when workspace.update! raises' do
      it 'returns failure instead of raising' do
        allow(workspace).to receive(:update!).and_raise(ActiveRecord::RecordInvalid.new(workspace))
        result = described_class.call(workspace: workspace, params: valid_params)
        expect(result).to be_failure
      end
    end
  end
end
