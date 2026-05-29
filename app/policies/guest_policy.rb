# frozen_string_literal: true

class GuestPolicy < ApplicationPolicy
  def index?   = false
  def show?    = false
  def create?  = user.role_guest?
  def update?  = false
  def destroy? = false

  class Scope < ApplicationPolicy::Scope
    def resolve = @scope.none
  end
end
