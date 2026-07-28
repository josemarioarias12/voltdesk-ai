# frozen_string_literal: true

class AssistantConversationsController < ApplicationController
  def show
    conversation = AssistantConversation.current_for(user: current_user, workspace: current_workspace)
    authorize conversation

    render json: {
      conversation_id: conversation.id,
      messages: conversation.assistant_messages.order(:created_at).map { |m| serialize_message(m) }
    }
  end

  private

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
