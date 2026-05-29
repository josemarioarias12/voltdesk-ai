# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  def index?   = admin_or_above? || manager_or_above?
  def show?    = admin_or_above? || record == user
  def create?  = admin_or_above?
  def update?  = admin_or_above? || record == user
  def destroy? = admin_or_above? && record != user

  class Scope < ApplicationPolicy::Scope
    def resolve
      return @scope.all if @user.role_super_admin?

      @scope.where(workspace_id: @user.workspace_id)
    end
  end
end
