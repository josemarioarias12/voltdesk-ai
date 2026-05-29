# frozen_string_literal: true

class SessionsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_before_action :set_current_workspace
  skip_before_action :set_current_user

  def new
    redirect_to root_path if user_signed_in?
    render inertia: 'Login/Index'
  end
end
