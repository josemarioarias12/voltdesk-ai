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

  describe '#ensure_title!' do
    it 'sets the title from the content, capitalized and truncated' do
      conversation = create(:assistant_conversation, workspace: workspace, user: user)

      conversation.ensure_title!('printer is not working on floor 3')

      expect(conversation.reload.title).to eq('Printer is not working on floor 3')
    end

    it 'does not raise and leaves the title blank when content is only whitespace' do
      conversation = create(:assistant_conversation, workspace: workspace, user: user)

      expect { conversation.ensure_title!('   ') }.not_to raise_error
      expect(conversation.reload.title).to be_nil
    end

    it 'truncates content longer than 60 characters' do
      conversation  = create(:assistant_conversation, workspace: workspace, user: user)
      long_content  = 'a' * 100

      conversation.ensure_title!(long_content)

      expect(conversation.reload.title.length).to eq(60)
    end

    it 'does not overwrite an existing title' do
      conversation = create(:assistant_conversation, workspace: workspace, user: user, title: 'Existing title')

      conversation.ensure_title!('some new content')

      expect(conversation.reload.title).to eq('Existing title')
    end

    it 'strips leading whitespace before capitalizing' do
      conversation = create(:assistant_conversation, workspace: workspace, user: user)

      conversation.ensure_title!('   leading whitespace')

      expect(conversation.reload.title).to eq('Leading whitespace')
    end
  end
end
