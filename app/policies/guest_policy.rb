# frozen_string_literal: true

class GuestPolicy < ApplicationPolicy
  def index?          = false
  def show?           = false
  def create?         = user.role_guest?
  def create_ticket?  = user.role_guest? && active_demo_token?
  def update?         = false
  def destroy?        = false

  class Scope < ApplicationPolicy::Scope
    def resolve = @scope.none
  end

  private

  def active_demo_token?
    return false unless record.is_a?(String) && record.present?

    REDIS.exists?("demo_token:#{record}")
  end
end
