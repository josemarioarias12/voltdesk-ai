# frozen_string_literal: true

class PublicController < ActionController::Base
  def landing
    render inertia: 'Home/Index'
  end
end
