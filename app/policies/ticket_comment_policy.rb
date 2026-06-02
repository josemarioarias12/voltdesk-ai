# frozen_string_literal: true

class TicketCommentPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      if can_see_internal?
        scope.all
      else
        scope.public_comments
      end
    end
  end

  def index?
    !guest?
  end

  def show?
    return false if guest?
    return true unless record.internal?
    can_see_internal?
  end

  def create?
    return false if guest?
    if employee?
      return record.ticket.created_by_id == user.id
    end
    true
  end

  def create_internal?
    !employee? && !guest?
  end

  def destroy?
    return false if guest?
    record.user_id == user.id || admin_or_manager?
  end

  private

  def guest?   = user.role.to_sym == :guest
  def employee? = user.role.to_sym == :employee

  def can_see_internal?
    user.role.to_sym.in?(%i[
      super_admin workspace_admin agent
      hr_manager it_manager facilities_manager
      operations_manager department_manager
    ])
  end

  def admin_or_manager?
    user.role.to_sym.in?(%i[
      super_admin workspace_admin hr_manager it_manager
      facilities_manager operations_manager department_manager
    ])
  end
end
