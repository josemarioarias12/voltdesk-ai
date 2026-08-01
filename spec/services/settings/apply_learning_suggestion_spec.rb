# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Settings::ApplyLearningSuggestion do
  let(:workspace) { create(:workspace) }

  let(:learning_suggestion) do
    {
      'summary' => 'Billing tickets are often mislabeled as technical_support',
      'suggested_prompt_addition' => 'If the issue involves payment or invoices, classify as billing.',
      'correction_patterns' => [{ 'from' => 'billing', 'to' => 'technical_support', 'count' => 30, 'pct' => 60.0 }],
      'confidence' => 0.85,
      'generated_at' => Time.current.iso8601,
      'corrections_before_apply' => 50
    }
  end

  context 'with a learning_suggestion present' do
    before { workspace.update!(settings: workspace.settings.merge('learning_suggestion' => learning_suggestion)) }

    it 'returns success' do
      result = described_class.call(workspace: workspace)
      expect(result).to be_success
    end

    it 'appends suggested_prompt_addition to custom_prompt_context' do
      described_class.call(workspace: workspace)
      expect(workspace.reload.settings['custom_prompt_context'])
        .to include('If the issue involves payment or invoices, classify as billing.')
    end

    it 'marks applied_at on the learning_suggestion' do
      described_class.call(workspace: workspace)
      expect(workspace.reload.settings['learning_suggestion']['applied_at']).to be_present
    end

    it 'preserves existing custom_prompt_context instead of overwriting it' do
      workspace.update!(settings: workspace.settings.merge('custom_prompt_context' => 'Existing context line.'))
      described_class.call(workspace: workspace)
      context = workspace.reload.settings['custom_prompt_context']
      expect(context).to include('Existing context line.')
      expect(context).to include('If the issue involves payment or invoices, classify as billing.')
    end
  end

  context 'without a learning_suggestion' do
    it 'returns failure with No suggestion available.' do
      result = described_class.call(workspace: workspace)
      expect(result).to be_failure
      expect(result.error).to eq('No suggestion available.')
    end
  end
end
