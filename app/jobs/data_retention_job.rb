# frozen_string_literal: true

class DataRetentionJob
  include Sidekiq::Job

  sidekiq_options queue: 'default', retry: 3

  def perform
    DataRetentionPolicy.auto_purge_enabled.includes(:workspace).find_each do |policy|
      purge_records_for(policy)
    end
  end

  private

  def purge_records_for(policy)
    cutoff    = policy.purge_before_date
    workspace = policy.workspace
    count     = 0

    case policy.resource_type
    when 'tickets'
      count = Ticket.where(workspace: workspace)
                    .where(created_at: ...cutoff)
                    .where(status: %w[closed resolved])
                    .delete_all
    when 'ai_audit_logs'
      count = AiAuditLog.where(workspace: workspace)
                        .where(created_at: ...cutoff)
                        .delete_all
    when 'notifications'
      count = Notification.where(workspace: workspace)
                          .where(created_at: ...cutoff)
                          .delete_all
    end

    policy.update_columns(last_purge_at: Time.current) # rubocop:disable Rails/SkipsModelValidations

    ComplianceLog.create!(
      workspace:     workspace,
      actor:         nil,
      event_type:    :data_purge,
      resource_type: policy.resource_type,
      resource_id:   policy.id,
      ip_address:    nil,
      metadata:      {
        purged_count: count,
        cutoff_date:  cutoff.iso8601,
        triggered_by: 'DataRetentionJob'
      }
    )

    Rails.logger.info("[DataRetentionJob] Purged #{count} #{policy.resource_type} " \
                      "for workspace #{workspace.id} (cutoff: #{cutoff})")
  rescue StandardError => e
    Rails.logger.error("[DataRetentionJob] Failed for policy #{policy.id}: #{e.message}")
  end
end
