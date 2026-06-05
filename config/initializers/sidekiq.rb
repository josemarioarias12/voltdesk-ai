# frozen_string_literal: true

require 'dotenv'
Dotenv.load(Rails.root.join('.env').to_s)

if defined?(Sidekiq)
  Sidekiq.configure_server do |config|
    config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }

    config.on(:startup) do
      Sidekiq::Cron::Job.load_from_array([
        {
          'name'  => 'Daily Digest — 9am',
          'cron'  => '0 9 * * *',
          'class' => 'DailyDigestJob'
        },
        {
          'name'  => 'Warranty Alert — 8am daily',
          'cron'  => '0 8 * * *',
          'class' => 'WarrantyAlertJob'
        }
      ])
    end
  end

  Sidekiq.configure_client do |config|
    config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
  end
end
