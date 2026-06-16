# frozen_string_literal: true

Rails.logger.debug '  Creating compliance logs and data retention policies...'

Workspace.find_each do |ws|
  next if ws.slug == 'demo'

  users  = User.where(workspace: ws)
  admin  = users.find(&:role_workspace_admin?)
  agent  = users.find(&:role_agent?)
  count  = ws.slug == 'consultingpro' ? 200 : 40

  event_types = ComplianceLog.event_types.keys

  count.times do |idx|
    actor      = idx.even? ? admin : agent
    event_type = event_types[idx % event_types.size]
    created_at = rand(1..60).days.ago + rand(0..23).hours

    ComplianceLog.create!(
      workspace:     ws,
      actor:         actor,
      event_type:    event_type,
      resource_type: %w[Ticket User Asset LeaveRequest].sample,
      resource_id:   rand(1..999).to_s,
      ip_address:    "192.168.#{rand(1..10)}.#{rand(1..254)}",
      metadata: {
        'action'     => event_type,
        'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'details'    => "Automated compliance event ##{idx + 1}"
      },
      created_at:    created_at,
      updated_at:    created_at
    )
  end

  Rails.logger.debug { "  ComplianceLogs for #{ws.name}: #{ComplianceLog.where(workspace: ws).count}" }

  # GDPR purge simulation for ConsultingPro
  if ws.slug == 'consultingpro'
    2.times do |idx|
      ComplianceLog.create!(
        workspace:     ws,
        actor:         admin,
        event_type:    :gdpr_request,
        resource_type: 'User',
        resource_id:   "PURGED-#{idx + 1}",
        ip_address:    '10.0.0.1',
        metadata: {
          'action'      => 'gdpr_right_to_erasure',
          'purged_at'   => rand(5..30).days.ago.iso8601,
          'ghost_user'  => true,
          'fields_cleared' => %w[email first_name last_name bank_account salary]
        },
        created_at: rand(5..30).days.ago
      )
    end
    Rails.logger.debug { "  GDPR purge logs added for #{ws.name}" }
  end

  # Data Retention Policies
  DataRetentionPolicy.seed_defaults_for(ws)
  Rails.logger.debug { "  DataRetentionPolicies for #{ws.name}: #{DataRetentionPolicy.where(workspace: ws).count}" }
end

Rails.logger.debug { "  ComplianceLogs total: #{ComplianceLog.count}" }
Rails.logger.debug { "  DataRetentionPolicies total: #{DataRetentionPolicy.count}" }
