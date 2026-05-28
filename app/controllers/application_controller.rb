# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include Pundit::Authorization

  private

  def current_workspace
    nil
  end
  helper_method :current_workspace
end
