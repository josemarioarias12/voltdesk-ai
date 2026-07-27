# frozen_string_literal: true

class AssistantConversation < ApplicationRecord
  belongs_to :workspace
  belongs_to :user
  has_many :assistant_messages, dependent: :destroy

  def self.current_for(user:, workspace:)
    find_or_create_by!(workspace: workspace, user: user)
  end
end
