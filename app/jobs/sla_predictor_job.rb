# frozen_string_literal: true

class SlaPredictorJob < ApplicationJob
  queue_as :ai_processing

  def perform(workspace_id = nil)
    workspaces = workspace_id ? [Workspace.find(workspace_id)] : Workspace.all
    workspaces.each { |workspace| process_workspace(workspace) }
  end

  private

  def process_workspace(workspace)
    workspace.tickets
             .open_tickets
             .where.not(due_at: nil)
             .includes(:assigned_to, :department, :sla_policy, :workspace)
             .find_each { |ticket| score_ticket(ticket) }
  end

  def score_ticket(ticket)
    result = Ai::SlaRiskScorer.call(ticket: ticket)
    Rails.logger.warn("[SlaPredictorJob] ticket=#{ticket.id} #{result.error}") unless result.success?
  rescue StandardError => e
    Rails.logger.error("[SlaPredictorJob] ticket=#{ticket.id} error=#{e.message}")
  end
end
