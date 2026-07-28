# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AssistantConversationsController, type: :request do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /assistant/conversation' do
    before { sign_in user }

    it 'returns 200' do
      get assistant_conversation_path
      expect(response).to have_http_status(:ok)
    end

    it 'creates a conversation on first access' do
      expect { get assistant_conversation_path }.to change(AssistantConversation, :count).by(1)
    end

    it 'reuses the existing active conversation on subsequent access' do
      get assistant_conversation_path
      first_id = response.parsed_body['conversation_id']

      expect { get assistant_conversation_path }.not_to change(AssistantConversation, :count)
      expect(response.parsed_body['conversation_id']).to eq(first_id)
    end
  end

  describe 'GET /assistant/conversations' do
    before { sign_in user }

    it 'returns only conversations belonging to the current user' do
      mine       = create(:assistant_conversation, workspace: workspace, user: user)
      other_user = create(:user, workspace: workspace, role: :employee)
      create(:assistant_conversation, workspace: workspace, user: other_user)

      get assistant_conversations_path
      ids = response.parsed_body['conversations'].pluck('id')

      expect(ids).to contain_exactly(mine.id)
    end

    it 'includes the archived flag' do
      create(:assistant_conversation, :archived, workspace: workspace, user: user)

      get assistant_conversations_path
      archived = response.parsed_body['conversations'].first

      expect(archived['archived']).to be true
    end
  end

  describe 'POST /assistant/conversations' do
    before { sign_in user }

    it 'archives the current conversation and creates a new one' do
      current = AssistantConversation.current_for(user: user, workspace: workspace)

      expect { post assistant_conversations_path }.to change(AssistantConversation, :count).by(1)
      expect(current.reload.archived_at).to be_present
    end

    it 'returns the new conversation id, not the archived one' do
      previous = AssistantConversation.current_for(user: user, workspace: workspace)
      post assistant_conversations_path

      expect(response.parsed_body['conversation_id']).not_to eq(previous.id)
    end
  end

  describe 'PATCH /assistant/conversations/:id/activate' do
    before { sign_in user }

    it 'touches the conversation updated_at' do
      conversation = create(:assistant_conversation, workspace: workspace, user: user, updated_at: 1.day.ago)

      patch activate_assistant_conversation_path(conversation)

      expect(conversation.reload.updated_at).to be_within(1.second).of(Time.current)
    end

    it 'returns not_found for a conversation belonging to another user' do
      other_user = create(:user, workspace: workspace, role: :employee)
      foreign    = create(:assistant_conversation, workspace: workspace, user: other_user)

      patch activate_assistant_conversation_path(foreign)

      expect(response).to have_http_status(:not_found)
    end

    it 'unarchives the conversation' do
      conversation = create(:assistant_conversation, :archived, workspace: workspace, user: user)

      patch activate_assistant_conversation_path(conversation)

      expect(conversation.reload.archived_at).to be_nil
    end
  end

  describe 'GET /assistant/conversation pagination' do
    before { sign_in user }

    it 'returns has_more true and only the last 30 messages when there are more' do
      conversation = AssistantConversation.current_for(user: user, workspace: workspace)
      35.times { |i| create(:assistant_message, assistant_conversation: conversation, content: "msg #{i}") }

      get assistant_conversation_path
      json = response.parsed_body

      expect(json['has_more']).to be true
      expect(json['messages'].size).to eq(30)
    end
  end

  describe 'GET /assistant/conversations/:id/messages' do
    before { sign_in user }

    it 'returns the page before the given message id' do
      conversation = AssistantConversation.current_for(user: user, workspace: workspace)
      created = Array.new(35) { |i| create(:assistant_message, assistant_conversation: conversation, content: "msg #{i}") }
      cutoff  = created[5].id

      get assistant_conversation_messages_path(conversation), params: { before_id: cutoff }
      json = response.parsed_body

      expect(json['messages'].pluck('id')).to eq(created[0..4].map(&:id))
      expect(json['has_more']).to be false
    end
  end
end
