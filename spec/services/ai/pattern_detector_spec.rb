# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ai::PatternDetector do
  let(:workspace) { create(:workspace) }

  describe '.call' do
    context 'when fewer than 5 recent tickets with embeddings' do
      it 'returns success with nil' do
        create_list(:ticket, 4, workspace: workspace, created_at: 30.minutes.ago)
        result = described_class.call(workspace: workspace)
        expect(result).to be_success
        expect(result.data).to be_nil
      end
    end

    context 'when 5+ similar tickets exist' do
      let(:embedding) { Array.new(1536) { rand(-1.0..1.0) } }

      before do
        tickets = create_list(:ticket, 5, workspace: workspace, created_at: 30.minutes.ago)
        tickets.each { |t| create(:ticket_embedding, ticket: t, workspace: workspace, embedding: embedding) }
      end

      it 'creates a PatternAlert' do
        expect do
          described_class.call(workspace: workspace)
        end.to change(PatternAlert, :count).by(1)
      end

      it 'broadcasts to managers channel' do
        expect(ActionCable.server).to receive(:broadcast).once
        described_class.call(workspace: workspace)
      end

      it 'returns success with the created alerts' do
        result = described_class.call(workspace: workspace)
        expect(result).to be_success
        expect(result.data).to be_an(Array)
        expect(result.data.first).to be_a(PatternAlert)
      end
    end

    context 'when a duplicate alert exists within 1 hour' do
      let(:embedding) { Array.new(1536) { rand(-1.0..1.0) } }

      before do
        tickets = create_list(:ticket, 5, workspace: workspace, created_at: 30.minutes.ago)
        tickets.each { |t| create(:ticket_embedding, ticket: t, workspace: workspace, embedding: embedding) }
        allow(ActionCable.server).to receive(:broadcast)
      end

      it 'does not create a duplicate alert' do
        described_class.call(workspace: workspace)
        expect do
          described_class.call(workspace: workspace)
        end.not_to change(PatternAlert, :count)
      end
    end

    context 'when tickets are outside the 2-hour window' do
      let(:embedding) { Array.new(1536) { rand(-1.0..1.0) } }

      it 'ignores old tickets' do
        tickets = create_list(:ticket, 5, workspace: workspace, created_at: 3.hours.ago)
        tickets.each { |t| create(:ticket_embedding, ticket: t, workspace: workspace, embedding: embedding) }

        result = described_class.call(workspace: workspace)
        expect(result).to be_success
        expect(result.data).to be_nil
      end
    end
  end
end
