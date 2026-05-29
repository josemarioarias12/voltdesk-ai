# frozen_string_literal: true

class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    raise Pundit::NotAuthorizedError, 'Must be logged in.' unless user

    @user   = user
    @record = record
  end

  def index?   = false
  def show?    = false
  def create?  = false
  def update?  = false
  def destroy? = false

  class Scope
    def initialize(user, scope)
      @user  = user
      @scope = scope
    end

    def resolve
      return @scope.none unless @user

      @scope.where(workspace_id: @user.workspace_id)
    end

    private

    attr_reader :user, :scope
  end

  protected

  def super_admin?
    user.role_super_admin?
  end

  def admin_or_above?
    user.role_super_admin? || user.role_workspace_admin?
  end

  def manager_or_above?
    admin_or_above? ||
      user.role_hr_manager? ||
      user.role_it_manager? ||
      user.role_facilities_manager? ||
      user.role_operations_manager? ||
      user.role_department_manager?
  end

  def agent_or_above?
    manager_or_above? || user.role_agent?
  end

  def same_workspace?(resource_workspace_id)
    user.workspace_id == resource_workspace_id
  end
end
