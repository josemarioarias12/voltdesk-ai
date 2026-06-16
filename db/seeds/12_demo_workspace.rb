# frozen_string_literal: true

Rails.logger.debug '  Creating DEMO workspace (QR Demo Mode)...'

# Demo workspace — curated for 5-minute demo of all modules
demo_ws = Workspace.create!(
  name:                'PulseDesk Demo',
  slug:                'demo',
  plan:                'enterprise',
  active:              true,
  ai_provider:         'openai',
  ai_model:            'gpt-4o',
  ai_fallback_provider: 'anthropic',
  ai_selection_mode:   'primary',
  settings: {
    'timezone'             => 'America/New_York',
    'language'             => 'en',
    'automation_threshold' => 0.85,
    'human_in_the_loop'    => true,
    'features'             => {
      'voice_to_ticket'    => true,
      'qr_demo_mode'       => true,
      'pattern_detection'  => true,
      'executive_reports'  => true,
      'anomaly_detection'  => true,
      'workflow_automation' => true
    }
  }
)

# Departments
demo_depts = {}
[
  { name: 'IT',         color: '#0ea5e9', icon: 'laptop'   },
  { name: 'HR',         color: '#22c55e', icon: 'users'    },
  { name: 'Facilities', color: '#f97316', icon: 'building' },
  { name: 'General',    color: '#14b8a6', icon: 'briefcase' }
].each do |data|
  demo_depts[data[:name]] = Department.create!(workspace: demo_ws, name: data[:name],
                                               color: data[:color], icon: data[:icon])
end

# SLA Policies
demo_slas = {}
[
  { name: 'Critical SLA', priority: :critical, first_response_hours: 1,  resolution_hours: 4  },
  { name: 'High SLA',     priority: :high,     first_response_hours: 2,  resolution_hours: 8  },
  { name: 'Medium SLA',   priority: :medium,   first_response_hours: 4,  resolution_hours: 24 },
  { name: 'Low SLA',      priority: :low,      first_response_hours: 8,  resolution_hours: 72 }
].each do |data|
  demo_slas[data[:priority].to_s] = SlaPolicy.create!(
    workspace: demo_ws, name: data[:name], priority: data[:priority],
    first_response_hours: data[:first_response_hours], resolution_hours: data[:resolution_hours]
  )
end

# Users — well-known demo credentials
demo_users = {}
[
  { email: 'demo_admin@pulsedesk.ai',    first_name: 'Demo',  last_name: 'Admin',    role: :workspace_admin,
dept: 'IT'      },
  { email: 'demo_agent@pulsedesk.ai',    first_name: 'Demo',  last_name: 'Agent',    role: :agent,
dept: 'IT'      },
  { email: 'demo_hr@pulsedesk.ai',       first_name: 'Demo',  last_name: 'HR',       role: :hr_manager,
dept: 'HR'      },
  { email: 'demo_it@pulsedesk.ai',       first_name: 'Demo',  last_name: 'IT',       role: :it_manager,
dept: 'IT'      },
  { email: 'demo_employee@pulsedesk.ai', first_name: 'Demo',  last_name: 'Employee', role: :employee,
dept: 'General' }
].each do |data|
  user = User.create!(
    workspace:             demo_ws,
    email:                 data[:email],
    first_name:            data[:first_name],
    last_name:             data[:last_name],
    role:                  data[:role],
    department:            demo_depts[data[:dept]],
    password:              'DemoPass2024!',
    password_confirmation: 'DemoPass2024!',
    active:                true
  )
  demo_users[data[:role].to_s] = user
end

admin    = demo_users['workspace_admin']
agent    = demo_users['agent']
employee = demo_users['employee']

# Ticket 1 — critical with SLA breach in ~20 minutes
critical_ticket = Ticket.create!(
  workspace:     demo_ws,
  ticket_number: 'TK-DEMO-001',
  title:         'Production database unreachable — all services down',
  description:   'Production DB server is completely unreachable. All 50 users affected. Revenue impact ongoing.',
  status:        :in_progress,
  priority:      :critical,
  category:      :it,
  source:        :web,
  urgency_score: 99,
  department:    demo_depts['IT'],
  sla_policy:    demo_slas['critical'],
  created_by:    employee,
  assigned_to:   agent,
  due_at:        20.minutes.from_now,
  created_at:    2.hours.ago,
  ai_metadata:   { 'confidence' => 0.97, 'category' => 'it', 'priority' => 'critical' }
)

# Cluster tickets for PatternAlert demo
[
  'API gateway returning 504 timeout errors',
  'User login failing - SSO broken',
  'Reports dashboard completely blank',
  'Payment processing queue stuck',
  'Monitoring alerts flooding - 300 per minute'
].each_with_index do |title, idx|
  Ticket.create!(
    workspace:     demo_ws,
    ticket_number: "TK-DEMO-00#{idx + 2}",
    title:         title,
    description:   "Related to production DB outage. Service #{idx + 1} affected.",
    status:        :open,
    priority:      :critical,
    category:      :it,
    source:        :web,
    urgency_score: rand(88..96),
    department:    demo_depts['IT'],
    sla_policy:    demo_slas['critical'],
    created_by:    employee,
    assigned_to:   agent,
    due_at:        30.minutes.from_now,
    created_at:    rand(30..90).minutes.ago,
    ai_metadata:   { 'confidence' => rand(0.88..0.96).round(2), 'category' => 'it', 'priority' => 'critical' }
  )
end

# Historical tickets for volume
10.times do |idx|
  Ticket.create!(
    workspace:     demo_ws,
    ticket_number: "TK-DEMO-#{(idx + 10).to_s.rjust(3, '0')}",
    title:         "Historical ticket ##{idx + 1}",
    description:   'Resolved historical ticket for demo dashboard metrics.',
    status:        :resolved,
    priority:      %i[low medium high].sample,
    category:      %i[it hr facilities].sample,
    source:        :web,
    urgency_score: rand(20..70),
    department:    demo_depts.values.sample,
    sla_policy:    demo_slas['medium'],
    created_by:    employee,
    assigned_to:   agent,
    due_at:        rand(5..30).days.ago + 8.hours,
    created_at:    rand(5..30).days.ago,
    resolved_at:   rand(4..28).days.ago,
    ai_metadata:   { 'confidence' => rand(0.75..0.95).round(2) }
  )
end

# AgentAction — pending approval, confidence 0.91
AgentAction.create!(
  workspace:   demo_ws,
  ticket:      critical_ticket,
  action_type: :auto_resolve,
  status:      :pending_approval,
  confidence:  0.91,
  result: {
    'suggested_action'          => 'Restart database service and failover to replica',
    'estimated_resolution_time' => '15 minutes',
    'risk_level'                => 'medium',
    'steps'                     => [
      'Identify root cause via logs',
      'Initiate failover to replica DB',
      'Verify all services restored',
      'Notify affected users'
    ]
  }
)

# PatternAlert — 6 tickets in cluster
PatternAlert.create!(
  workspace:   demo_ws,
  alert_type:  :ticket_cluster,
  severity:    :critical,
  title:       'DB Outage Cluster — 6 critical tickets in 2 hours',
  description: '6 critical tickets detected in last 2 hours all related to DB outage. Cluster detected by AI.',
  metadata:    { 'ticket_ids' => Ticket.where(workspace: demo_ws).limit(6).pluck(:id) }
)

# Asset — risk_score 88
Asset.create!(
  workspace:          demo_ws,
  asset_number:       'AST-DEMO-001',
  name:               'Production Database Server',
  asset_type:         :server,
  status:             :in_maintenance,
  risk_score:         88,
  incident_count:     3,
  serial_number:      'SRV-PROD-DB-01',
  warranty_expires_at: 15.days.from_now,
  assigned_to:        agent,
  ai_metadata:        { 'recommendation' => 'Schedule immediate maintenance',
'risk_factors' => %w[incident_history warranty_expiring] }
)

# LeaveRequest — with medical_notes for masking demo
LeaveRequest.create!(
  workspace:    demo_ws,
  user:         employee,
  leave_type:   :sick_leave,
  start_date:   3.days.from_now.to_date,
  end_date:     7.days.from_now.to_date,
  status:       :pending,
  reason:       'Medical leave required.',
  medical_notes: 'Doctor diagnosed acute condition requiring 4 days rest. Certificate attached.',
  approved_by:  nil
)

# Space + Reservation
demo_space = Space.create!(
  workspace:  demo_ws,
  name:       'Main Conference Room',
  floor:      '2',
  capacity:   20,
  space_type: :conference_room,
  equipment:  { 'projector' => true, 'whiteboard' => true, 'video_conferencing' => true },
  status:     :available
)

SpaceReservation.create!(
  workspace:       demo_ws,
  space:           demo_space,
  user:            admin,
  title:           'Emergency Incident Review',
  start_at:        1.hour.from_now,
  end_at:          3.hours.from_now,
  attendees_count: 8,
  status:          :confirmed
)

# WorkflowRule — triggerable live
WorkflowRule.create!(
  workspace:       demo_ws,
  name:            'Critical tickets auto-escalate to IT manager',
  trigger_event:   :ticket_created,
  conditions:      { 'priority' => 'critical', 'status' => 'open' },
  actions:         { 'reassign_to_role' => 'it_manager', 'notify' => true },
  active:          true,
  execution_count: 6
)

# ApiKey + Webhook
raw_token = SecureRandom.hex(32)
ApiKey.create!(
  workspace:    demo_ws,
  user:         admin,
  name:         'Demo Integration Key',
  key_digest:   Digest::SHA256.hexdigest(raw_token),
  active:       true,
  last_used_at: 1.hour.ago,
  scopes:       { 'read' => %w[tickets users], 'write' => ['tickets'] }
)

Webhook.create!(
  workspace:         demo_ws,
  name:              'Demo Webhook',
  url:               'https://hooks.demo.example.com/pulsedesk',
  secret_digest:     Digest::SHA256.hexdigest(SecureRandom.hex(16)),
  events:            ['ticket.created', 'sla.breached'],
  active:            true,
  last_triggered_at: 30.minutes.ago,
  failure_count:     0
)

# AiAuditLog entries
20.times do |idx|
  AiAuditLog.create!(
    workspace:         demo_ws,
    user:              admin,
    operation:         %w[ticket_classification response_suggestion pattern_detection].sample,
    model:             'gpt-4o',
    provider:          'openai',
    prompt:            "Demo AI operation ##{idx + 1}",
    response:          "{\"result\":\"processed\",\"confidence\":0.#{rand(80..97)}}",
    prompt_tokens:     rand(150..400),
    completion_tokens: rand(80..200),
    duration_ms:       rand(400..2000),
    confidence_score:  rand(0.80..0.97).round(2),
    status:            :success,
    created_at:        rand(1..14).days.ago
  )
end

# Additional assets for demo:verify compliance
[
  { name: 'Backup Server',          risk_score: 55, incident_count: 1, serial: 'SRV-BAK-02', status: :active        },
  { name: 'Developer Laptop',       risk_score: 20, incident_count: 0, serial: 'LAP-DEV-01', status: :active        },
  { name: 'Network Switch',         risk_score: 40, incident_count: 1, serial: 'NSW-HQ-01',  status: :active        },
  { name: 'Security Camera System', risk_score: 60, incident_count: 2, serial: 'CAM-01',     status: :in_maintenance }
].each_with_index do |data, idx|
  Asset.create!(
    workspace:          demo_ws,
    asset_number:       "AST-DEMO-#{(idx + 2).to_s.rjust(3, '0')}",
    name:               data[:name],
    asset_type:         :server,
    status:             data[:status],
    risk_score:         data[:risk_score],
    incident_count:     data[:incident_count],
    serial_number:      data[:serial],
    warranty_expires_at: 90.days.from_now,
    assigned_to:        agent,
    department:         demo_depts['IT'],
    ai_metadata:        { 'recommendation' => 'Monitor regularly' }
  )
end

# Additional historical tickets for demo workspace (reach 50+)
35.times do |idx|
  Ticket.create!(
    workspace:     demo_ws,
    ticket_number: "TK-DEMO-H#{(idx + 1).to_s.rjust(2, '0')}",
    title:         "Historical demo ticket ##{idx + 1}",
    description:   'Resolved historical ticket for demo dashboard metrics and reporting.',
    status:        %i[resolved closed].sample,
    priority:      %i[low medium high].sample,
    category:      %i[it hr facilities].sample,
    source:        :web,
    urgency_score: rand(20..70),
    department:    demo_depts.values.sample,
    sla_policy:    demo_slas['medium'],
    created_by:    employee,
    assigned_to:   agent,
    due_at:        rand(5..55).days.ago + 8.hours,
    created_at:    rand(5..55).days.ago,
    resolved_at:   rand(4..50).days.ago,
    ai_metadata:   { 'confidence' => rand(0.75..0.95).round(2) }
  )
end

# DataRetentionPolicy
DataRetentionPolicy.seed_defaults_for(demo_ws)

Rails.logger.debug { "  DEMO workspace created: #{demo_ws.name}" }
Rails.logger.debug { "  Tickets: #{Ticket.where(workspace: demo_ws).count}" }
Rails.logger.debug '  Demo credentials:'
Rails.logger.debug '    demo_admin@pulsedesk.ai    DemoPass2024!  [workspace_admin]'
Rails.logger.debug '    demo_agent@pulsedesk.ai    DemoPass2024!  [agent]'
Rails.logger.debug '    demo_employee@pulsedesk.ai DemoPass2024!  [employee]'
