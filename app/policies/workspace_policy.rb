# frozen_string_literal: true

class WorkspacePolicy < ApplicationPolicy
  def index?   = super_admin?
  def show?    = super_admin? || same_workspace?(record.id)
  def create?  = super_admin?
  def update?  = super_admin? || (admin_or_above? && same_workspace?(record.id))
  def destroy? = super_admin?
  def manage_demo? = admin_or_above? && same_workspace?(record.id)

  class Scope < ApplicationPolicy::Scope
    def resolve
      return @scope.all if @user.role_super_admin?

      @scope.where(id: @user.workspace_id)
    end
  end
end
