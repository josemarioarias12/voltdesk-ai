# frozen_string_literal: true

class AiHealthPolicy < ApplicationPolicy
  def index?
    user.role_workspace_admin? || user.role_super_admin?
  end
end
