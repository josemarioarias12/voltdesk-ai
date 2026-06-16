# frozen_string_literal: true

class ClassificationCorrection < ApplicationRecord
  belongs_to :workspace
  belongs_to :ticket
  belongs_to :agent, class_name: 'User'

  validates :original_category,  presence: true
  validates :corrected_category, presence: true

  scope :for_workspace, ->(ws) { where(workspace: ws) }
  scope :recent,        ->(num = 50) { order(created_at: :desc).limit(num) }
end
