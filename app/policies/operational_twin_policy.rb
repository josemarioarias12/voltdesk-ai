# frozen_string_literal: true

class OperationalTwinPolicy < ApplicationPolicy
  def show?
    user.role_workspace_admin? || user.role_agent?
  end
end
