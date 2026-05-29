# frozen_string_literal: true

class TicketPolicy < ApplicationPolicy
  def index?   = user.active?
  def show?    = user.active? && (agent_or_above? || record.created_by_id == user.id)
  def create?  = user.active?
  def update?  = agent_or_above?
  def destroy? = admin_or_above?

  class Scope < ApplicationPolicy::Scope
    def resolve
      base = @scope.where(workspace_id: @user.workspace_id)

      case @user.role
      when 'employee'
        base.where(created_by_id: @user.id)
      when 'department_manager'
        base.where(department_id: @user.department_id)
      else
        base
      end
    end
  end
end
