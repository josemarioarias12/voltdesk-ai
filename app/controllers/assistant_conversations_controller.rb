# frozen_string_literal: true

class AssistantConversationsController < ApplicationController
  include JsonErrorHandling

  def index
    authorize AssistantConversation
    conversations = policy_scope(AssistantConversation).order(updated_at: :desc)

    render json: { conversations: conversations.map { |c| serialize_conversation(c) } }
  end

  def show
    conversation = AssistantConversation.current_for(user: current_user, workspace: current_workspace)
    authorize conversation

    render json: conversation_payload(conversation)
  end

  def create
    current = AssistantConversation.current_for(user: current_user, workspace: current_workspace)
    authorize current, :update?
    current.archive!

    conversation = AssistantConversation.create!(workspace: current_workspace, user: current_user)
    render json: conversation_payload(conversation)
  end

  def activate
    conversation = policy_scope(AssistantConversation).find(params.expect(:id))
    authorize conversation, :activate?
    conversation.activate!

    render json: conversation_payload(conversation)
  end

  private

  def conversation_payload(conversation)
    {
      conversation_id: conversation.id,
      messages: conversation.assistant_messages.order(:created_at).map { |m| serialize_message(m) }
    }
  end

  def serialize_conversation(conversation)
    {
      id: conversation.id,
      title: conversation.title,
      archived: conversation.archived_at.present?,
      updated_at: conversation.updated_at.iso8601
    }
  end

  def serialize_message(message)
    {
      id: message.id,
      role: message.role,
      content: message.content,
      created_at: message.created_at.iso8601,
      report: report_payload(message)
    }
  end

  def report_payload(message)
    return nil unless message.report_file.attached?

    {
      url: url_for(message.report_file),
      filename: message.report_file.filename.to_s,
      content_type: message.report_file.content_type
    }
  end
end
