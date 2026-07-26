# frozen_string_literal: true

class ClimateSurveyResponse < ApplicationRecord
  belongs_to :climate_survey
  belongs_to :user

  validates :rating, presence: true, numericality: {
    only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5
  }
  validates :recommend_score, presence: true, numericality: {
    only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5
  }
  validates :user_id, uniqueness: { scope: :climate_survey_id, message: 'has already responded to this survey' }

  validate :survey_is_active, on: :create

  private

  def survey_is_active
    return unless climate_survey

    errors.add(:base, 'Survey is not currently accepting responses') unless climate_survey.active?
  end
end
