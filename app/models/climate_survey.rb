# frozen_string_literal: true

class ClimateSurvey < ApplicationRecord
  include WorkspaceScoped

  belongs_to :workspace
  belongs_to :department, optional: true
  belongs_to :created_by, class_name: 'User'
  has_many :climate_survey_responses, dependent: :destroy

  enum :status, {
    draft: 0,
    active: 1,
    closed: 2
  }

  validates :title, presence: true

  scope :recent, -> { order(created_at: :desc) }

  def self.available_for(user)
    responded_ids = ClimateSurveyResponse.where(user: user).select(:climate_survey_id)
    active.where(workspace: user.workspace)
          .where(department_id: [nil, user.department_id])
          .where.not(id: responded_ids)
  end

  def eligible_users
    scope = workspace.users.where.not(role: :guest)
    department_id ? scope.where(department_id: department_id) : scope
  end

  def participation_count
    climate_survey_responses.count
  end

  def eligible_count
    eligible_users.count
  end
end
