# frozen_string_literal: true

# Load .env for Sidekiq worker process — dotenv-rails only auto-loads in
# the Rails server process, not in Sidekiq's separate process.
require 'dotenv'
Dotenv.load(Rails.root.join('.env').to_s)

if defined?(Sidekiq)
  Sidekiq.configure_server do |config|
    config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
  end

  Sidekiq.configure_client do |config|
    config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
  end
end
