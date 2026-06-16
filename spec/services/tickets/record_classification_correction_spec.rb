# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Tickets::RecordClassificationCorrection do
  let!(:workspace) { create(:workspace) }
  let!(:dept)      { create(:department, workspace: workspace) }
  let!(:agent)     { create(:user, workspace: workspace, role: :agent) }
  let!(:ticket)    { create(:ticket, workspace: workspace, department: dept, ai_metadata: { 'category' => 'billing' }) }

  describe '.call' do
    context 'when ticket was not classified by AI' do
      let!(:ticket_no_ai) { create(:ticket, workspace: workspace, department: dept, ai_metadata: {}) }

      it 'returns failure with ticket_not_ai_classified' do
        result = described_class.call(ticket: ticket_no_ai, agent: agent, corrected_category: 'technical_support')
        expect(result.success?).to be false
        expect(result.error).to eq('ticket_not_ai_classified')
      end
    end

    context 'when corrected_category equals original_category' do
      it 'returns failure with no_change' do
        result = described_class.call(ticket: ticket, agent: agent, corrected_category: 'billing')
        expect(result.success?).to be false
        expect(result.error).to eq('no_change')
      end
    end

    context 'with valid correction' do
      it 'creates a ClassificationCorrection record' do
        expect do
          described_class.call(ticket: ticket, agent: agent, corrected_category: 'technical_support')
        end.to change(ClassificationCorrection, :count).by(1)
      end

      it 'stores original and corrected categories correctly' do
        described_class.call(ticket: ticket, agent: agent, corrected_category: 'technical_support', note: 'wrong cat')
        correction = ClassificationCorrection.last
        expect(correction.original_category).to eq('billing')
        expect(correction.corrected_category).to eq('technical_support')
        expect(correction.correction_note).to eq('wrong cat')
        expect(correction.agent).to eq(agent)
      end

      it 'returns ServiceResult.success with the correction' do
        result = described_class.call(ticket: ticket, agent: agent, corrected_category: 'technical_support')
        expect(result.success?).to be true
        expect(result.data).to be_a(ClassificationCorrection)
      end
    end
  end
end
