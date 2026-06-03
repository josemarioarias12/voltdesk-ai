# frozen_string_literal: true

module Hr
  class GenerateOnboardingPlanJob < ApplicationJob
    queue_as :ai_processing

    def perform(user_id)
      user = User.find_by(id: user_id)
      return unless user

      result = Hr::GenerateOnboardingPlan.call(user: user)

      return unless result.failure?

      Rails.logger.error("GenerateOnboardingPlanJob failed for user #{user_id}: #{result.error}")
    end
  end
end
