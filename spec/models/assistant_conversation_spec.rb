# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AssistantConversation, type: :model do
  let!(:workspace) { create(:workspace) }
  let!(:user)      { create(:user, workspace: workspace) }

  describe '.current_for' do
    it 'creates a new conversation when none exists' do
      expect do
        described_class.current_for(user: user, workspace: workspace)
      end.to change(described_class, :count).by(1)
    end

    it 'returns the most recent active conversation instead of creating one' do
      existing = create(:assistant_conversation, workspace: workspace, user: user)

      result = described_class.current_for(user: user, workspace: workspace)

      expect(result).to eq(existing)
    end

    it 'ignores archived conversations and creates a new one' do
      create(:assistant_conversation, :archived, workspace: workspace, user: user)

      expect do
        described_class.current_for(user: user, workspace: workspace)
      end.to change(described_class, :count).by(1)
    end
  end

  describe '#archive!' do
    it 'sets archived_at' do
      conversation = create(:assistant_conversation, workspace: workspace, user: user)

      expect { conversation.archive! }.to change(conversation, :archived_at).from(nil)
    end
  end
end
