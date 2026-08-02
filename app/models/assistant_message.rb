# frozen_string_literal: true

class AssistantMessage < ApplicationRecord
  belongs_to :assistant_conversation, touch: true
  has_many :ai_audit_logs, dependent: :nullify
  has_one_attached :report_file

  enum :role, {
    user: 0,
    assistant: 1
  }, prefix: :role

  validates :content, presence: true
end
