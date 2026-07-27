# frozen_string_literal: true

class AssistantConversationPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(user: user, workspace: user.workspace)
    end
  end

  def show?   = record.user_id == user.id
  def create? = true
  def update? = record.user_id == user.id
end
