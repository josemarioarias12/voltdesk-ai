# frozen_string_literal: true

class OnboardingPlanPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.role_hr_manager? || user.role_workspace_admin? || user.role_super_admin?
        scope.where(workspace: user.workspace)
      else
        scope.where(workspace: user.workspace, user: user)
      end
    end
  end

  def show?
    record.user == user || user.role_hr_manager? || admin_or_above?
  end

  def update?
    record.user == user || user.role_hr_manager? || admin_or_above?
  end
end
