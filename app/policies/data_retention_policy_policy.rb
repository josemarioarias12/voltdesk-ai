# frozen_string_literal: true

class DataRetentionPolicyPolicy < ApplicationPolicy
  def index?
    user.role_workspace_admin? || user.role_super_admin?
  end

  def create?
    user.role_workspace_admin? || user.role_super_admin?
  end

  def update?
    user.role_workspace_admin? || user.role_super_admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.role_super_admin?
        scope.all
      else
        scope.for_workspace(user.workspace)
      end
    end
  end
end
