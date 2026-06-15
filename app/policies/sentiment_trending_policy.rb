# frozen_string_literal: true

class SentimentTrendingPolicy < ApplicationPolicy
  def index?
    user.role_workspace_admin? || user.role_super_admin? ||
      user.role_hr_manager? || user.role_manager?
  end
end
