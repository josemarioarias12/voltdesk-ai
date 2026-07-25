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
    return false if owner?
    return false unless record.pending?
    return true if admin_or_above? || user.role_hr_manager?

    department_manager_owns? && record.medical_notes.blank?
  end

  def final_approve?
    return false if owner?

    record.pending_second_approval? && admin_or_above?
  end

  def reject?
    return false if owner?

    if record.pending_second_approval?
      admin_or_above?
    else
      record.pending? && (admin_or_above? || user.role_hr_manager? || (department_manager_owns? && record.medical_notes.blank?))
    end
  end

  def destroy?
    owner? && record.pending?
  end

  private

  def owner?
    record.user == user
  end

  def department_manager_owns?
    user.role_department_manager? && record.department_id == user.department_id
  end
end
