# frozen_string_literal: true

class LeaveRequestPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.role_hr_manager? || user.role_workspace_admin? || user.role_super_admin?
        scope.where(workspace: user.workspace)
      elsif user.role_department_manager?
        scope.where(workspace: user.workspace, department_id: user.department_id)
      else
        scope.where(workspace: user.workspace, user: user)
      end
    end
  end

  def index?
    true
  end

  def show?
    record.user == user || admin_or_above? || user.role_hr_manager? || department_manager_owns?
  end

  def create?
    agent_or_above? || user.role_employee?
  end

  def approve?
    return false if record.user == user
    return true if admin_or_above? || user.role_hr_manager?

    department_manager_owns? && record.medical_notes.blank?
  end

  def reject?
    approve?
  end

  def destroy?
    record.user == user && record.pending?
  end

  private

  def department_manager_owns?
    user.role_department_manager? && record.department_id == user.department_id
  end
end
