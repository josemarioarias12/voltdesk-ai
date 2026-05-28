# frozen_string_literal: true

InertiaRails.configure do |config|
  config.version = Rails.env.production? ? ENV.fetch('CURRENT_SHA', '1') : 'dev'
end
