# frozen_string_literal: true

class OnboardingTask < ApplicationRecord
  belongs_to :onboarding_plan

  enum :category, {
    setup: 0,
    team: 1,
    systems: 2,
    contributions: 3
  }

  validates :title,       presence: true
  validates :order_index, presence: true

  scope :ordered, -> { order(:order_index) }

  after_save :update_plan_completion

  private

  def update_plan_completion
    onboarding_plan.recalculate_completion!
  end
end
