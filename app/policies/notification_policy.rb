# frozen_string_literal: true

class NotificationPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(user: user)
    end
  end

  def index?
    true
  end

  def update?
    record == :notification || record.user == user
  end
end
