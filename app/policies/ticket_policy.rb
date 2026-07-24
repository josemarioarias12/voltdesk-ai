# frozen_string_literal: true

class TicketPolicy < ApplicationPolicy
  ADMIN_MANAGER_ROLES = %i[
    super_admin workspace_admin hr_manager it_manager
    facilities_manager operations_manager
  ].freeze

  NON_EDITABLE_STATUSES = %i[resolved closed].freeze

  # ── Scope ─────────────────────────────────────────────────────────────────────
  class Scope < ApplicationPolicy::Scope
    def resolve
      case user.role.to_sym
      when *ADMIN_MANAGER_ROLES
        scope.all

      when :department_manager
        scope.where(department_id: user.department_id)

      when :agent
        scope.where(
          'assigned_to_id = :uid OR department_id = :dept',
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

    admin_or_manager? || agent_can_see? || employee_owns? || department_manager_owns?
  end

  # Anyone (any role, including guest via the QR self-service flow) can create
  # a ticket. Intentional product decision — do not restrict by role here.
  def create?
    true
  end

  def update?
    return false if guest?

    admin_or_manager? || assigned_agent? || department_manager_owns? || employee_can_edit?
  end

  def resolve_ticket?
    return false if guest? || employee?

    admin_or_manager? || assigned_agent? || department_manager_owns?
  end

  def change_priority?
    return false if guest? || employee?

    admin_or_manager? || assigned_agent? || department_manager_owns?
  end

  def assign?
    admin_or_manager? || department_manager_owns?
  end

  # Real per-ticket checks happen inside Tickets::BulkUpdate via find_each.
  def bulk_update?
    !guest?
  end

  def view_internal_comments?
    !employee? && !guest?
  end

  def add_internal_comment?
    !employee? && !guest?
  end

  private

  def guest?           = user.role.to_sym == :guest
  def employee?        = user.role.to_sym == :employee
  def registered_user? = !guest?

  def admin_or_manager?
    user.role.to_sym.in?(ADMIN_MANAGER_ROLES)
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

  def employee_can_edit?
    employee_owns? && !record.status.to_sym.in?(NON_EDITABLE_STATUSES)
  end
end
