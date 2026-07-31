# frozen_string_literal: true

class AssistantConversationsController < ApplicationController
  include JsonErrorHandling

  MESSAGES_PAGE_SIZE = 30

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

  def update
    conversation = policy_scope(AssistantConversation).find(params.expect(:id))
    authorize conversation, :update?

    conversation.update!(title: params[:title].to_s.strip.presence&.truncate(60))
    render json: serialize_conversation(conversation)
  end

  def destroy
    conversation = policy_scope(AssistantConversation).find(params.expect(:id))
    authorize conversation, :update?
    conversation.archive!

    render json: { archived: true }
  end

  def activate
    conversation = policy_scope(AssistantConversation).find(params.expect(:id))
    authorize conversation, :activate?
    conversation.activate!

    render json: conversation_payload(conversation)
  end

  def messages
    conversation = policy_scope(AssistantConversation).find(params.expect(:id))
    authorize conversation, :show?

    scope = conversation.assistant_messages.order(id: :desc)
    scope = scope.where(id: ...params[:before_id].to_i) if params[:before_id].present?

    page     = scope.limit(MESSAGES_PAGE_SIZE + 1).to_a
    has_more = page.size > MESSAGES_PAGE_SIZE
    ordered  = page.first(MESSAGES_PAGE_SIZE).reverse

    render json: { messages: ordered.map { |m| serialize_message(m) }, has_more: has_more }
  end

  private

  def conversation_payload(conversation)
    page     = conversation.assistant_messages.order(id: :desc).limit(MESSAGES_PAGE_SIZE + 1).to_a
    has_more = page.size > MESSAGES_PAGE_SIZE
    ordered  = page.first(MESSAGES_PAGE_SIZE).reverse

    {
      conversation_id: conversation.id,
      messages: ordered.map { |m| serialize_message(m) },
      has_more: has_more
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
      report: report_payload(message),
      resource_link: message.metadata['resource_link']
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
