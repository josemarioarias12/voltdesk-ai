# frozen_string_literal: true

class AdminAreaPolicy < ApplicationPolicy
  def access?
    admin_or_above?
  end
end
