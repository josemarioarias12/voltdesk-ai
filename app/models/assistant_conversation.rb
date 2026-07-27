# frozen_string_literal: true

class AssistantConversation < ApplicationRecord
  belongs_to :workspace
  belongs_to :user
  has_many :assistant_messages, dependent: :destroy
end
