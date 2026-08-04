# frozen_string_literal: true

module Admin
  class BaseController < ApplicationController
    before_action :authenticate_user!
    before_action :authorize_admin_area!

    private

    def authorize_admin_area!
      authorize :admin_area, :access?
    end
  end
end
