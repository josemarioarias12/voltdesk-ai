# frozen_string_literal: true

class AssistantMessagesController < ApplicationController
  def create
    conversation = AssistantConversation.current_for(user: current_user, workspace: current_workspace)
    authorize conversation, :update?

    content = params[:content].to_s.strip
    return render json: { error: 'blank_message' }, status: :unprocessable_content if content.blank?

    result = Ai::WorkspaceAssistant::HandleQuery.call(
      conversation: conversation,
      user: current_user,
      workspace: current_workspace,
      message: content,
      locale: I18n.locale.to_s
    )

    if result.success?
      render json: { content: result.data[:content], tools_used: result.data[:tools_used] }
    else
      render json: { error: result.error }, status: :unprocessable_content
    end
  end
end
