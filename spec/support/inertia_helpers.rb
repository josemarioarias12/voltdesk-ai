# frozen_string_literal: true

module InertiaHelpers
  def inertia_headers
    { 'X-Inertia' => 'true' }
  end
end

RSpec.configure do |config|
  config.include InertiaHelpers, type: :request
end
