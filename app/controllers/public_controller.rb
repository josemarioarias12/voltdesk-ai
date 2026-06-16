# frozen_string_literal: true

class PublicController < ActionController::Base
  layout 'application'

  def landing
    render inertia: 'Home/Index'
  end
end
