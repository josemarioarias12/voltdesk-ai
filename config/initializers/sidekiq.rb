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
                                           },
                                           {
                                             'name'  => 'Pattern Detector — daily 8am',
                                             'cron'  => '0 8 * * *',
                                             'class' => 'PatternDetectorJob'
                                           },
                                           {
                                             'name'  => 'Executive Report — Monday 7am',
                                             'cron'  => '0 7 * * 1',
                                             'class' => 'ExecutiveReportJob'
                                           },
                                           {
                                             'name'  => 'SLA Predictor — daily 8:30am',
                                             'cron'  => '30 8 * * *',
                                             'class' => 'SlaPredictorJob'
                                           },
                                           {
                                             'name'  => 'Anomaly Detector — daily 9am',
                                             'cron'  => '0 9 * * *',
                                             'class' => 'AnomalyDetectorJob'
                                           },
                                           {
                                             'name'  => 'Data Retention Purge — 2am daily',
                                             'cron'  => '0 2 * * *',
                                             'class' => 'DataRetentionJob'
                                           }
                                         ])
    end
  end

  Sidekiq.configure_client do |config|
    config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
  end
end
