# frozen_string_literal: true

module Ai
  class ModelGovernanceSuggestionPolicy < ApplicationPolicy
    def index?
      admin_or_above?
    end

    def show?
      admin_or_above?
    end

    def approve?
      admin_or_above?
    end

    def reject?
      admin_or_above?
    end

    def mark_applied?
      admin_or_above?
    end

    def sync_now?
      admin_or_above?
    end

    class Scope < ApplicationPolicy::Scope
      def resolve
        return @scope.none unless @user && (@user.role_super_admin? || @user.role_workspace_admin?)

        @scope.all
      end
    end
  end
end
