# frozen_string_literal: true

class DemoGuestCleanupJob
  include Sidekiq::Job

  sidekiq_options queue: 'default', retry: 3

  RETENTION_DAYS = 7

  def perform
    cutoff = RETENTION_DAYS.days.ago

    User.role_guest.where(created_at: ...cutoff).group_by(&:workspace_id).each do |workspace_id, guests|
      purge_guests_for(workspace_id, guests, cutoff)
    end
  end

  private

  def purge_guests_for(workspace_id, guests, cutoff)
    workspace = Workspace.find_by(id: workspace_id)
    return unless workspace

    placeholder = removed_guest_placeholder_for(workspace)
    count       = guests.size

    reassign_tickets_to_placeholder(guests, placeholder)
    User.where(id: guests.map(&:id)).destroy_all

    ComplianceLog.create!(
      workspace:     workspace,
      actor:         nil,
      event_type:    :bulk_delete,
      resource_type: 'demo_guests',
      resource_id:   workspace.id,
      ip_address:    nil,
      metadata:      {
        purged_count: count,
        cutoff_date:  cutoff.iso8601,
        triggered_by: 'DemoGuestCleanupJob'
      }
    )

    Rails.logger.info("[DemoGuestCleanupJob] Purged #{count} guest accounts " \
                      "for workspace #{workspace.id} (cutoff: #{cutoff})")
  rescue StandardError => e
    Rails.logger.error("[DemoGuestCleanupJob] Failed for workspace #{workspace_id}: #{e.message}")
  end

  def removed_guest_placeholder_for(workspace)
    User.find_or_create_by!(email: "demo-guest-removed@workspace-#{workspace.id}.voltdesk.internal") do |user|
      user.workspace  = workspace
      user.password   = SecureRandom.hex(16)
      user.role       = :guest
      user.first_name = 'Demo Guest'
      user.last_name  = '(Removed)'
      user.active     = false
    end
  end

  def reassign_tickets_to_placeholder(guests, placeholder)
    guest_ids = guests.map(&:id)
    Ticket.where(created_by_id: guest_ids).update_all(created_by_id: placeholder.id) # rubocop:disable Rails/SkipsModelValidations
    Ticket.where(assigned_to_id: guest_ids).update_all(assigned_to_id: placeholder.id) # rubocop:disable Rails/SkipsModelValidations
  end
end
