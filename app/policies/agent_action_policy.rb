# frozen_string_literal: true

class AgentActionPolicy < ApplicationPolicy
  def index?
    user.role_workspace_admin? || user.role_agent? || user.role.to_sym.in?(MANAGER_ROLES)
  end

  MANAGER_ROLES = %i[hr_manager it_manager facilities_manager operations_manager department_manager].freeze

  def approve?
    user.role_workspace_admin? || user.role_agent? || user.role.to_sym.in?(MANAGER_ROLES)
  end

  def reject?
    user.role_workspace_admin? || user.role_agent? || user.role.to_sym.in?(MANAGER_ROLES)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.for_workspace(user.workspace_id).pending
    end
  end
end
