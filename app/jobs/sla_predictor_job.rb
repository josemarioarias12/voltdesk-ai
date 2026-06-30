# frozen_string_literal: true

class SlaPredictorJob < ApplicationJob
  queue_as :ai_processing

  BATCH_SIZE = 10
  PREDICTION_COOLDOWN = 4.hours
  BREACH_THRESHOLD = 0.70

  def perform(workspace_id = nil)
    workspaces = workspace_id ? [Workspace.find(workspace_id)] : Workspace.all
    workspaces.each { |workspace| process_workspace(workspace) }
  end

  private

  def process_workspace(workspace)
    tickets = workspace.tickets
                       .open_tickets
                       .where(
                         'sla_predicted_at IS NULL OR sla_predicted_at < ?',
                         PREDICTION_COOLDOWN.ago
                       )
                       .includes(:assigned_to, :department, :sla_policy, :workspace)
                       .limit(BATCH_SIZE)

    tickets.each { |ticket| predict_and_notify(ticket) }
  end

  def predict_and_notify(ticket)
    result = Ai::SlaPredictor.call(ticket: ticket)
    return unless result.success?

    return unless result.data[:at_risk]

    Ai::SlaNotifier.call(
      ticket:               ticket,
      probability:          result.data[:probability],
      contributing_factors: result.data[:contributing_factors]
    )
  rescue StandardError => e
    Rails.logger.error("[SlaPredictorJob] ticket=#{ticket.id} error=#{e.message}")
  end
end
