# frozen_string_literal: true

require 'pundit/matchers'

RSpec.configure do |config|
  config.include Pundit::Matchers, type: :policy
end
