# frozen_string_literal: true

class AssetIncidentPolicy < ApplicationPolicy
  def index?  = it_manager? || workspace_admin? || super_admin?
  def show?   = it_manager? || workspace_admin? || super_admin?
  def create? = it_manager? || workspace_admin? || super_admin?
  def update? = it_manager? || workspace_admin? || super_admin?
  def destroy? = workspace_admin? || super_admin?

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(workspace: user.workspace)
    end
  end

  private

  def it_manager?      = user.role_it_manager?
  def workspace_admin? = user.role_workspace_admin?
  def super_admin?     = user.role_super_admin?
end
