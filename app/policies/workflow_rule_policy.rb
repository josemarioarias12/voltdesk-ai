# frozen_string_literal: true

class WorkflowRulePolicy < ApplicationPolicy
  def index?
    user.role_workspace_admin?
  end

  def create?
    user.role_workspace_admin?
  end

  def update?
    user.role_workspace_admin?
  end

  def destroy?
    user.role_workspace_admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.for_workspace(user.workspace_id)
    end
  end
end
