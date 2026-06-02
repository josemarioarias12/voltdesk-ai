# frozen_string_literal: true

# Cron schedule (add to config/sidekiq.yml):
#   - name: "SLA Checker"
#     cron: "*/5 * * * *"
#     class: "SlaCheckerJob"
#     queue: sla_monitoring
class SlaCheckerJob < ApplicationJob
  queue_as :sla_monitoring

  sidekiq_options retry: 0

  def perform
    Workspace.where(active: true).find_each do |workspace|
      check_workspace_tickets(workspace)
    end
  end

  private

  def check_workspace_tickets(workspace)
    workspace.tickets
             .open_tickets
             .where.not(due_at: nil)
             .includes(:assigned_to, :activities, :department)
             .order(:due_at)
             .find_each do |ticket|
      Tickets::SlaChecker.call(ticket:)
    end
  rescue StandardError => e
    Rails.logger.error("[SlaCheckerJob] workspace #{workspace.id}: #{e.class}: #{e.message}")
  end
end
