# frozen_string_literal: true

class AssetPolicy < ApplicationPolicy
  def index?
    it_manager? || workspace_admin? || super_admin? || operations_manager?
  end

  def show?
    it_manager? || workspace_admin? || super_admin? || operations_manager?
  end

  def create?
    it_manager? || workspace_admin? || super_admin?
  end

  def update?
    it_manager? || workspace_admin? || super_admin?
  end

  def destroy?
    workspace_admin? || super_admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(workspace: user.workspace)
    end
  end

  private

  def it_manager?        = user.role_it_manager?
  def workspace_admin?   = user.role_workspace_admin?
  def super_admin?       = user.role_super_admin?
  def operations_manager? = user.role_operations_manager?
end
