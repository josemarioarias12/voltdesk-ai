# frozen_string_literal: true

module Hr
  class OnboardingPlansController < ApplicationController
    before_action :set_plan, only: %i[show update_task]

    def show
      authorize @plan

      render inertia: 'HR/OnboardingPlan/Show', props: {
        plan: serialize_plan(@plan),
        user: {
          name: current_user.full_name,
          role: current_user.role.humanize,
          department: current_user.department&.name || 'General'
        }
      }
    end

    def update_task
      authorize @plan, :update?

      task = @plan.onboarding_tasks.find(params.expect(:task_id))
      task.update!(completed: params[:completed])

      render inertia: 'HR/OnboardingPlan/Show', props: {
        plan: serialize_plan(@plan.reload),
        user: {
          name: current_user.full_name,
          role: current_user.role.humanize,
          department: current_user.department&.name || 'General'
        }
      }
    end

    private

    def set_plan
      @plan = policy_scope(OnboardingPlan).find(params.expect(:id))
    end

    def serialize_plan(plan)
      sections = plan.onboarding_tasks.ordered.group_by(&:category).map do |category, tasks|
        {
          category: category,
          title: category.humanize,
          tasks: tasks.map do |task|
            {
              id: task.id,
              title: task.title,
              completed: task.completed,
              due_date: task.due_date&.strftime('%b %d'),
              order_index: task.order_index
            }
          end
        }
      end

      {
        id: plan.id,
        status: plan.status,
        completion_percentage: plan.completion_percentage,
        target_completion_date: plan.target_completion_date&.strftime('%b %d, %Y'),
        started_at: plan.created_at.strftime('%b %d, %Y'),
        tasks_completed: plan.onboarding_tasks.where(completed: true).count,
        tasks_total: plan.onboarding_tasks.count,
        sections: sections
      }
    end
  end
end
