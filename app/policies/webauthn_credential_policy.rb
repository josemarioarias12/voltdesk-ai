# frozen_string_literal: true

class WebauthnCredentialPolicy < ApplicationPolicy
  def index? = true

  def destroy?
    owns_record? || admin_or_above?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return @scope.none unless @user

      @scope.where(workspace_id: @user.workspace_id, user_id: @user.id)
    end
  end

  private

  def owns_record?
    record.user_id == user.id
  end
end
