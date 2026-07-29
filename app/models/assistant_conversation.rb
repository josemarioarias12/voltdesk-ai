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
    self.class.active.where(workspace: workspace, user: user).where.not(id: id)
        .update_all(archived_at: Time.current) # rubocop:disable Rails/SkipsModelValidations
    update!(archived_at: nil, updated_at: Time.current)
  end

  def ensure_title!(content)
    return if title.present?

    cleaned = content.strip
    return if cleaned.blank?

    formatted = cleaned[0].upcase + cleaned[1..]
    update!(title: formatted.truncate(60))
  end
end
