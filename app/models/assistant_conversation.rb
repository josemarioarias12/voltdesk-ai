# frozen_string_literal: true

class AssistantConversation < ApplicationRecord
  belongs_to :workspace
  belongs_to :user
  has_many :assistant_messages, dependent: :destroy

  scope :active, -> { where(archived_at: nil) }
  scope :archived, -> { where.not(archived_at: nil) }

  def self.current_for(user:, workspace:)
    active.where(workspace: workspace, user: user).order(updated_at: :desc).first ||
      create!(workspace: workspace, user: user)
  end

  def archive!
    update!(archived_at: Time.current)
  end

  def activate!
    touch
  end
end
