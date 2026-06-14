# frozen_string_literal: true

class AnomalyDetectorJob < ApplicationJob
  queue_as :ai_processing

  def perform(workspace_id = nil)
    workspaces = workspace_id ? [Workspace.find(workspace_id)] : Workspace.all
    workspaces.each { |workspace| process_workspace(workspace) }
  end

  private

  def process_workspace(workspace)
    result = Ai::AnomalyDetector.call(workspace: workspace)
    return unless result.success?

    result.data[:alerts_created].each do |alert|
      broadcast_alert(workspace, alert)
    end
  rescue StandardError => e
    Rails.logger.error("[AnomalyDetectorJob] workspace=#{workspace.id} error=#{e.message}")
  end

  def broadcast_alert(workspace, alert)
    ActionCable.server.broadcast(
      "operational_twin_#{workspace.id}",
      {
        type:            'anomaly_detected',
        alert_id:        alert.id,
        title:           alert.title,
        description:     alert.description,
        severity:        alert.severity,
        department_id:   alert.metadata['department_id'],
        department_name: alert.metadata['department_name'],
        zscore:          alert.metadata['zscore'],
        ticket_ids:      alert.metadata['ticket_ids']
      }
    )
  end
end
