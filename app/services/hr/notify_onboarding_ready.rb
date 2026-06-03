# frozen_string_literal: true

module Hr
  class NotifyOnboardingReady
    def self.call(**args) = new(**args).call

    def initialize(plan:)
      @plan = plan
      @user = plan.user
    end

    def call
      notification = create_notification
      broadcast(notification)
    rescue StandardError => e
      Rails.logger.error("Hr::NotifyOnboardingReady failed: #{e.message}")
    end

    private

    def create_notification
      Notification.create!(
        workspace: @plan.workspace,
        user: @user,
        title: 'Your onboarding plan is ready',
        body: "GPT-4o generated a personalized plan with #{@plan.onboarding_tasks.count} tasks for your role.",
        notification_type: :onboarding_plan_ready,
        resource_type: 'OnboardingPlan',
        resource_id: @plan.id
      )
    end

    def broadcast(notification)
      ActionCable.server.broadcast(
        "notifications_#{@user.id}",
        {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          notification_type: notification.notification_type,
          resource_type: notification.resource_type,
          resource_id: notification.resource_id,
          read: false,
          created_at: notification.created_at.iso8601
        }
      )
    end
  end
end
