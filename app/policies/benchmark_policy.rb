# frozen_string_literal: true

class BenchmarkPolicy < ApplicationPolicy
  def index?
    user.role_workspace_admin? || user.role_super_admin?
  end
end
