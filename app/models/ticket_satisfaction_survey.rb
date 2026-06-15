# frozen_string_literal: true

class TicketSatisfactionSurvey < ApplicationRecord
  include WorkspaceScoped

  belongs_to :workspace
  belongs_to :ticket
  belongs_to :department
  belongs_to :submitted_by, class_name: 'User'

  validates :sentiment_score, presence: true,
            numericality: { greater_than_or_equal_to: -1.0, less_than_or_equal_to: 1.0 }
  validates :rating, presence: true,
            numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }
  validates :ticket_id, uniqueness: { message: 'already has a satisfaction survey' } # rubocop:disable Rails/UniqueValidationWithoutIndex

  scope :for_period, ->(since) { where(created_at: since..) }
  scope :by_department, ->(dept_id) { where(department_id: dept_id) }
end
