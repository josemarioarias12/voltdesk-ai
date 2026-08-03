# frozen_string_literal: true

require 'dotenv'
Dotenv.load(Rails.root.join('.env').to_s)

if defined?(Sidekiq)
  Sidekiq.configure_server do |config|
    config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }

    config.on(:startup) do
      # Bang version purges Redis entries whose name is no longer in this
      # array — plain load_from_array only upserts, leaving renamed/removed
      # jobs running forever on their old schedule.
      Sidekiq::Cron::Job.load_from_array!([
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
                                            },
                                            {
                                              'name'  => 'Demo Guest Cleanup — 3am daily',
                                              'cron'  => '0 3 * * *',
                                              'class' => 'DemoGuestCleanupJob'
                                            },
                                            {
                                              'name'  => 'Model Governance Sync — daily 6am',
                                                'cron'  => '0 6 * * *',
                                                'class' => 'Ai::ModelGovernanceSyncJob'
                                            }
                                          ])
    end
  end

  Sidekiq.configure_client do |config|
    config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
  end
end
