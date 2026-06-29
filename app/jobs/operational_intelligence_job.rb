# frozen_string_literal: true

class OperationalIntelligenceJob
  include Sidekiq::Job

  sidekiq_options queue: 'default', retry: 2

  def perform(workspace_id)
    workspace = Workspace.find_by(id: workspace_id)
    return unless workspace

    result = Ai::OperationalIntelligenceService.call(workspace: workspace, period: 7.days)
    return unless result.success?

    result.data[:predictions]&.each do |prediction|
      next unless prediction[:confidence].to_f > 0.75

      TelegramNotifier.send_prediction(
        message: "#{prediction[:message]} — #{prediction[:recommendation]}",
        level: prediction[:urgency]&.to_sym || :info
      )
    end

    workspace.update!(
      settings: workspace.settings.merge('last_intelligence_report' => {
                                           'generated_at' => Time.current.iso8601,
        'summary'      => result.data[:summary],
        'roi'          => result.data[:weekly_roi]
                                         })
    )
  rescue StandardError => e
    Rails.logger.error("[OperationalIntelligenceJob] workspace=#{workspace_id} #{e.message}")
    raise
  end
end
