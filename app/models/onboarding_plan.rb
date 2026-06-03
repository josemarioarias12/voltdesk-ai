# frozen_string_literal: true

class OnboardingPlan < ApplicationRecord
  include WorkspaceScoped

  belongs_to :workspace
  belongs_to :user
  has_many :onboarding_tasks, dependent: :destroy

  enum :status, {
    in_progress: 0,
    completed: 1,
    paused: 2
  }

  def recalculate_completion!
    return if onboarding_tasks.empty?

    pct = (onboarding_tasks.where(completed: true).count.to_f / onboarding_tasks.count * 100).round
    update!(
      completion_percentage: pct,
      status: pct == 100 ? :completed : :in_progress
    )
  end
end
