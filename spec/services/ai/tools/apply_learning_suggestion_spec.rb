# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::ApplyLearningSuggestion do
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

  describe '.visible_to?' do
    it 'is visible only to workspace_admin and super_admin, matching WorkspacePolicy#manage_learning?' do
      visible = %i[super_admin workspace_admin]
      not_visible = %i[hr_manager it_manager facilities_manager operations_manager
                       department_manager agent employee guest]

      visible.each do |role|
        user = build(:user, workspace: workspace, role: role)
        expect(described_class.visible_to?(user)).to be(true)
      end

      not_visible.each do |role|
        user = build(:user, workspace: workspace, role: role)
        expect(described_class.visible_to?(user)).to be(false)
      end
    end
  end

  describe '#call' do
    subject(:tool) { described_class.new(user: admin, workspace: workspace, locale: 'en') }

    let(:admin) { create(:user, workspace: workspace, role: :workspace_admin) }

    context 'without a pending learning suggestion' do
      it 'returns failure' do
        result = tool.call

        expect(result).to be_failure
        expect(result.error).to include('no pending learning suggestion')
      end
    end

    context 'with a pending suggestion, preview (confirmed omitted or false)' do
      before { workspace.update!(settings: workspace.settings.merge('learning_suggestion' => learning_suggestion)) }

      it 'does not modify custom_prompt_context' do
        expect { tool.call }.not_to(change { workspace.reload.settings['custom_prompt_context'] })
      end

      it 'returns a preview summary' do
        result = tool.call

        expect(result).to be_success
        expect(result.data[:preview]).to be(true)
        expect(result.data[:summary]).to include(
          summary: learning_suggestion['summary'],
          suggested_prompt_addition: learning_suggestion['suggested_prompt_addition'],
          confidence: 0.85
        )
      end
    end

    context 'with a pending suggestion, confirmed: true' do
      before { workspace.update!(settings: workspace.settings.merge('learning_suggestion' => learning_suggestion)) }

      it 'appends suggested_prompt_addition to custom_prompt_context' do
        tool.call(confirmed: true)

        expect(workspace.reload.settings['custom_prompt_context'])
          .to include('If the issue involves payment or invoices, classify as billing.')
      end

      it 'returns applied: true with a resource_link' do
        result = tool.call(confirmed: true)

        expect(result).to be_success
        expect(result.data[:applied]).to be(true)
        expect(result.data[:resource_link]).to eq(
          title: 'AI Self-Learning',
          path: '/settings/learning',
          icon: 'sparkles'
        )
      end
    end

    context 'when the suggestion was already applied earlier' do
      before do
        applied_suggestion = learning_suggestion.merge('applied_at' => 1.hour.ago.iso8601)
        workspace.update!(settings: workspace.settings.merge('learning_suggestion' => applied_suggestion))
      end

      it 'does not modify custom_prompt_context again, even with confirmed: true' do
        expect { tool.call(confirmed: true) }.not_to(change { workspace.reload.settings['custom_prompt_context'] })
      end

      it 'returns already_applied: true instead of applied: true' do
        result = tool.call(confirmed: true)

        expect(result).to be_success
        expect(result.data[:already_applied]).to be(true)
        expect(result.data[:applied]).to be_nil
      end
    end
  end
end
