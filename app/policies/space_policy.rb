# frozen_string_literal: true

class SpacePolicy < ApplicationPolicy
  def index?
    active_member?
  end

  def show?
    active_member?
  end

  def create?
    facilities_manager_or_admin?
  end

  def update?
    facilities_manager_or_admin?
  end

  def destroy?
    facilities_manager_or_admin?
  end

  def utilization?
    facilities_manager_or_admin?
  end

  def optimize?
    facilities_manager_or_admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(workspace_id: user.workspace_id)
    end
  end

  private

  def active_member?
    user.active? && user.workspace_id == record.workspace_id
  end

  def facilities_manager_or_admin?
    active_member? && (user.role_facilities_manager? || user.role_workspace_admin? || user.role_super_admin?)
  end
end
