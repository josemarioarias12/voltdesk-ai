# frozen_string_literal: true

class SpaceReservationPolicy < ApplicationPolicy
  def index?
    active_member?
  end

  def show?
    owner_or_manager?
  end

  def create?
    active_member?
  end

  def cancel?
    owner_or_manager?
  end

  def destroy?
    facilities_manager_or_admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.role_facilities_manager? || user.role_workspace_admin? || user.role_super_admin?
        scope.where(workspace_id: user.workspace_id)
      else
        scope.where(workspace_id: user.workspace_id, user_id: user.id)
      end
    end
  end

  private

  def active_member?
    user.active? && user.workspace_id == record.workspace_id
  end

  def owner_or_manager?
    active_member? && (record.user_id == user.id || facilities_manager_or_admin?)
  end

  def facilities_manager_or_admin?
    user.role_facilities_manager? || user.role_workspace_admin? || user.role_super_admin?
  end
end
