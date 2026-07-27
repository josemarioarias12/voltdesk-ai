# frozen_string_literal: true

class AssistantMessage < ApplicationRecord
  belongs_to :assistant_conversation

  enum :role, {
    user: 0,
    assistant: 1
  }, prefix: :role

  validates :content, presence: true
end
