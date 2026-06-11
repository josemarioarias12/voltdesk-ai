# frozen_string_literal: true

class AgentActionPolicy < ApplicationPolicy
  def index?
    user.role_workspace_admin? || user.role_agent?
  end

  def approve?
    user.role_workspace_admin? || user.role_agent?
  end

  def reject?
    user.role_workspace_admin? || user.role_agent?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.for_workspace(user.workspace_id).pending
    end
  end
end
