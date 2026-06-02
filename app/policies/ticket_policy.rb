# frozen_string_literal: true

class TicketPolicy < ApplicationPolicy
  # ── Scope ─────────────────────────────────────────────────────────────────────
  class Scope < ApplicationPolicy::Scope
    def resolve
      case user.role.to_sym
      when :super_admin, :workspace_admin,
           :hr_manager, :it_manager, :facilities_manager,
           :operations_manager
        scope.all

      when :department_manager
        scope.where(department_id: user.department_id)

      when :agent
        scope.where(
          "assigned_to_id = :uid OR department_id = :dept",
          uid: user.id, dept: user.department_id
        )

      when :employee
        scope.where(created_by_id: user.id)

      else
        scope.none
      end
    end
  end

  # ── Actions ───────────────────────────────────────────────────────────────────
  def index?
    !guest?
  end

  def show?
    return false if guest?
    admin_or_manager? || agent_can_see? || employee_owns?
  end

  def create?
    registered_user? || guest?
  end

  def update?
    return false if guest?
    admin_or_manager? || assigned_agent? || department_manager_owns?
  end

  def resolve_ticket?
    return false if guest? || employee?
    admin_or_manager? || assigned_agent? || department_manager_owns?
  end

  def close?
    admin_or_manager?
  end

  def assign?
    admin_or_manager? || department_manager_owns?
  end

  def view_internal_comments?
    !employee? && !guest?
  end

  def add_internal_comment?
    !employee? && !guest?
  end

  def destroy?
    super_admin? || workspace_admin?
  end

  private

  def guest?           = user.role.to_sym == :guest
  def employee?        = user.role.to_sym == :employee
  def super_admin?     = user.role.to_sym == :super_admin
  def workspace_admin? = user.role.to_sym == :workspace_admin
  def registered_user? = !guest?

  def admin_or_manager?
    user.role.to_sym.in?(%i[
      super_admin workspace_admin hr_manager it_manager
      facilities_manager operations_manager
    ])
  end

  def agent_can_see?
    return false unless user.role.to_sym == :agent
    record.assigned_to_id == user.id ||
      record.department_id == user.department_id
  end

  def assigned_agent?
    user.role.to_sym == :agent && record.assigned_to_id == user.id
  end

  def department_manager_owns?
    user.role.to_sym == :department_manager &&
      record.department_id == user.department_id
  end

  def employee_owns?
    user.role.to_sym == :employee && record.created_by_id == user.id
  end
end
