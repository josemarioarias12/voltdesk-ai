# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::Tools::LearningInsights do
  subject(:tool)  { described_class.new(user: admin, workspace: workspace, locale: 'en') }

  let(:workspace) { create(:workspace) }
  let(:admin)     { create(:user, workspace: workspace, role: :workspace_admin) }

  describe '.visible_to?' do
    it 'is visible only to workspace_admin and super_admin, matching WorkspacePolicy#manage_learning?' do
      visible = %i[super_admin workspace_admin]
      not_visible = %i[hr_manager it_manager facilities_manager operations_manager
                       department_manager agent employee guest]

      visible.each do |role|
        expect(described_class.visible_to?(build(:user, workspace: workspace, role: role))).to be(true)
      end

      not_visible.each do |role|
        expect(described_class.visible_to?(build(:user, workspace: workspace, role: role))).to be(false)
      end
    end
  end

  describe '#call' do
    context 'with fewer corrections than the threshold and no suggestion yet' do
      before { create_list(:classification_correction, 3, workspace: workspace) }

      it 'reports progress with has_suggestion: false' do
        result = tool.call

        expect(result).to be_success
        expect(result.data[:total_corrections]).to eq(3)
        expect(result.data[:threshold]).to eq(50)
        expect(result.data[:has_suggestion]).to be(false)
        expect(result.data[:suggestion]).to be_nil
      end
    end

    context 'with a pending, unapplied suggestion' do
      let(:learning_suggestion) do
        {
          'summary' => 'Billing tickets are often mislabeled as technical_support',
          'suggested_prompt_addition' => 'If the issue involves payment or invoices, classify as billing.',
          'correction_patterns' => [{ 'from' => 'billing', 'to' => 'technical_support', 'count' => 30, 'pct' => 60.0 }],
          'confidence' => 0.85,
          'generated_at' => Time.current.iso8601
        }
      end

      before { workspace.update!(settings: workspace.settings.merge('learning_suggestion' => learning_suggestion)) }

      it 'reports has_suggestion: true with applied: false' do
        result = tool.call

        expect(result.data[:has_suggestion]).to be(true)
        expect(result.data[:suggestion]).to include(
          summary: learning_suggestion['summary'],
          suggested_prompt_addition: learning_suggestion['suggested_prompt_addition'],
          confidence: 0.85,
          applied: false
        )
      end
    end

    context 'with a suggestion that was already applied' do
      before do
        applied_suggestion = { 'summary' => 'x', 'suggested_prompt_addition' => 'y', 'applied_at' => 1.hour.ago.iso8601 }
        workspace.update!(settings: workspace.settings.merge('learning_suggestion' => applied_suggestion))
      end

      it 'reports applied: true' do
        result = tool.call

        expect(result.data[:suggestion][:applied]).to be(true)
      end
    end
  end
end
