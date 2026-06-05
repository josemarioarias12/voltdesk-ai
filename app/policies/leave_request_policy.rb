# frozen_string_literal: true

class LeaveRequestPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.role_hr_manager? || user.role_workspace_admin? || user.role_super_admin?
        scope.where(workspace: user.workspace)
      else
        scope.where(workspace: user.workspace, user: user)
      end
    end
  end

  def index?
    true
  end

  def show?
    record.user == user || admin_or_above? || user.role_hr_manager?
  end

  def create?
    agent_or_above? || user.role_employee?
  end

  def approve?
    return false if record.user == user

    user.role_hr_manager? || admin_or_above?
  end

  def reject?
    approve?
  end

  def destroy?
    record.user == user && record.pending?
  end
end
