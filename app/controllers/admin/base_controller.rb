# frozen_string_literal: true

module Admin
  class BaseController < ApplicationController
    before_action :authenticate_user!
    before_action :authorize_admin!

    private

    def authorize_admin!
      unless current_user.role_workspace_admin? || current_user.role_super_admin?
        raise Pundit::NotAuthorizedError, "Admin access required"
      end
    end
  end
end
