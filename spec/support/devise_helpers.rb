# frozen_string_literal: true

module DeviseHelpers
  def sign_in_as(user)
    post user_session_path, params: {
      user: { email: user.email, password: 'Password123!' }
    }
  end
end

RSpec.configure do |config|
  config.include Devise::Test::IntegrationHelpers, type: :request
  config.include DeviseHelpers, type: :request
end
