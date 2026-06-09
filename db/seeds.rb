# frozen_string_literal: true

# ============================================================
# PulseDesk AI — Demo Seeds v2.0
# Creates: 3 workspaces, 10 users each, 50+ tickets each,
#          assets, leave requests, onboarding plans,
#          pattern detection spike, AI audit log entries
# Usage: rails db:seed
# ============================================================

Rails.logger.debug '==> Seeding PulseDesk AI Demo Data...'

# ── Helpers ──────────────────────────────────────────────────
def random_past(days_min, days_max)
  rand(days_min..days_max).days.ago
end

# ── Workspaces ───────────────────────────────────────────────
workspaces_data = [
  { name: 'TechCorp',   slug: 'techcorp',   plan: 'enterprise' },
  { name: 'HealthCo',   slug: 'healthco',   plan: 'professional' },
  { name: 'RetailPlus', slug: 'retailplus', plan: 'professional' }
]

workspaces = workspaces_data.map do |data|
  ws = Workspace.find_or_create_by!(slug: data[:slug]) do |w|
    w.name                 = data[:name]
    w.plan                 = data[:plan]
    w.active               = true
    w.ai_provider          = 'openai'
    w.ai_model             = 'gpt-4o'
    w.ai_fallback_provider = 'anthropic'
    w.ai_selection_mode    = 'primary'
    w.settings             = {
      'timezone' => 'America/Costa_Rica',
      'language' => 'es',
      'features' => {
        'voice_to_ticket'   => true,
        'qr_demo_mode'      => true,
        'pattern_detection' => true,
        'executive_reports' => true
      }
    }
  end
  Rails.logger.debug { "  Workspace: #{ws.name}" }
  ws
end

workspaces[0]
workspaces[1]
workspaces[2]

# ── Departments (per workspace) ───────────────────────────────
departments_data = [
  { name: 'IT',         color: '#0ea5e9', icon: 'laptop'      },
  { name: 'HR',         color: '#22c55e', icon: 'users'       },
  { name: 'Facilities', color: '#f97316', icon: 'building'    },
  { name: 'Finance',    color: '#eab308', icon: 'dollar-sign' },
  { name: 'Operations', color: '#6366f1', icon: 'chart-bar'   },
  { name: 'General',    color: '#8b5cf6', icon: 'briefcase'   }
]

dept_map = {}
workspaces.each do |ws|
  dept_map[ws.slug] = {}
  departments_data.each do |data|
    dept = Department.find_or_create_by!(workspace: ws, name: data[:name]) do |dep|
      dep.color = data[:color]
      dep.icon  = data[:icon]
    end
    dept_map[ws.slug][data[:name]] = dept
  end
  Rails.logger.debug { "  Departments created for #{ws.name}" }
end

# ── SLA Policies (per workspace) ─────────────────────────────
sla_policies_data = [
  { name: 'Critical SLA', priority: :critical, first_response_hours: 1,  resolution_hours: 4  },
  { name: 'High SLA',     priority: :high,     first_response_hours: 2,  resolution_hours: 8  },
  { name: 'Medium SLA',   priority: :medium,   first_response_hours: 4,  resolution_hours: 24 },
  { name: 'Low SLA',      priority: :low,      first_response_hours: 8,  resolution_hours: 72 }
]

sla_map = {}
workspaces.each do |ws|
  sla_map[ws.slug] = {}
  sla_policies_data.each do |data|
    sla = SlaPolicy.find_or_create_by!(workspace: ws, name: data[:name]) do |s|
      s.priority             = data[:priority]
      s.first_response_hours = data[:first_response_hours]
      s.resolution_hours     = data[:resolution_hours]
    end
    sla_map[ws.slug][data[:priority].to_s] = sla
  end
end
Rails.logger.debug '  SLA Policies created for all workspaces'

# ── Users ────────────────────────────────────────────────────
users_blueprint = [
  { email_prefix: 'admin',      first_name: 'Admin',    last_name: 'Owner',     role: :workspace_admin,
dept: 'IT'         },
  { email_prefix: 'it.manager', first_name: 'James',    last_name: 'Wilson',    role: :it_manager,
dept: 'IT'         },
  { email_prefix: 'hr.manager', first_name: 'Maria',    last_name: 'Lopez',     role: :hr_manager,
dept: 'HR'         },
  { email_prefix: 'ops',        first_name: 'Diana',    last_name: 'Torres',    role: :operations_manager,
dept: 'Operations' },
  { email_prefix: 'agent1',     first_name: 'Sarah',    last_name: 'Connor',    role: :agent,
dept: 'IT'         },
  { email_prefix: 'agent2',     first_name: 'Luis',     last_name: 'Mendez',    role: :agent,
dept: 'HR'         },
  { email_prefix: 'dept.mgr',   first_name: 'Roberto',  last_name: 'Castillo',  role: :department_manager,
dept: 'Finance'   },
  { email_prefix: 'emp1',       first_name: 'Carlos',   last_name: 'Ramirez',   role: :employee,
dept: 'General'    },
  { email_prefix: 'emp2',       first_name: 'Ana',      last_name: 'Gutierrez', role: :employee,
dept: 'Finance'    },
  { email_prefix: 'emp3',       first_name: 'Pedro',    last_name: 'Vargas',    role: :employee,
dept: 'Operations' }
]

user_map = {}
workspaces.each do |ws|
  user_map[ws.slug] = {}
  slug_prefix = ws.slug

  users_blueprint.each do |data|
    email = "#{data[:email_prefix]}@#{slug_prefix}.pulsedesk.ai"
    user  = User.find_or_initialize_by(workspace: ws, email: email)
    if user.new_record?
      user.assign_attributes(
        first_name:            data[:first_name],
        last_name:             data[:last_name],
        role:                  data[:role],
        department_id:         dept_map[ws.slug][data[:dept]]&.id,
        password:              'Password123x',
        password_confirmation: 'Password123x',
        active:                true
      )
      user.save!
    end
    user_map[ws.slug][data[:email_prefix]] = user
  end
  Rails.logger.debug { "  Users created for #{ws.name}" }
end

# Also keep the legacy pulsedesk-demo workspace and users
legacy_ws = Workspace.find_or_create_by!(slug: 'pulsedesk-demo') do |w|
  w.name                 = 'PulseDesk Demo'
  w.plan                 = 'enterprise'
  w.active               = true
  w.ai_provider          = 'openai'
  w.ai_model             = 'gpt-4o'
  w.ai_fallback_provider = 'anthropic'
  w.ai_selection_mode    = 'primary'
  w.settings             = { 'timezone' => 'America/Costa_Rica', 'language' => 'es',
                              'features' => { 'voice_to_ticket' => true, 'qr_demo_mode' => true } }
end

departments_data.each do |data|
  Department.find_or_create_by!(workspace: legacy_ws, name: data[:name]) do |dep|
    dep.color = data[:color]
    dep.icon  = data[:icon]
  end
end

sla_policies_data.each do |data|
  SlaPolicy.find_or_create_by!(workspace: legacy_ws, name: data[:name]) do |s|
    s.priority             = data[:priority]
    s.first_response_hours = data[:first_response_hours]
    s.resolution_hours     = data[:resolution_hours]
  end
end

legacy_users = [
  { email: 'admin@pulsedesk.ai',    first_name: 'Admin',  last_name: 'PulseDesk', role: :workspace_admin,
dept: 'IT'      },
  { email: 'agent@pulsedesk.ai',    first_name: 'Sarah',  last_name: 'Connor',    role: :agent,
dept: 'IT'      },
  { email: 'hr@pulsedesk.ai',       first_name: 'Maria',  last_name: 'Lopez',     role: :hr_manager,
dept: 'HR'      },
  { email: 'it@pulsedesk.ai',       first_name: 'James',  last_name: 'Wilson',    role: :it_manager,
dept: 'IT'      },
  { email: 'employee@pulsedesk.ai', first_name: 'Carlos', last_name: 'Ramirez',   role: :employee,
dept: 'General' }
]

legacy_dept_map = Department.where(workspace: legacy_ws).index_by(&:name)
legacy_users.each do |data|
  user = User.find_or_initialize_by(workspace: legacy_ws, email: data[:email])
  next unless user.new_record?

  user.assign_attributes(
    first_name:            data[:first_name],
    last_name:             data[:last_name],
    role:                  data[:role],
    department_id:         legacy_dept_map[data[:dept]]&.id,
    password:              'Password123x',
    password_confirmation: 'Password123x',
    active:                true
  )
  user.save!
end
Rails.logger.debug '  Legacy pulsedesk-demo workspace preserved'

# ── Tickets ───────────────────────────────────────────────────
ticket_templates = [
  # IT tickets
  { title: 'Laptop not connecting to VPN',            dept: 'IT',         priority: :high,     category: :it,
    status: :resolved,  urgency: 82, source: :web,   description: 'My laptop suddenly stopped connecting to the corporate VPN. I have tried restarting but the issue persists.' },
  { title: 'Email client crashes on startup',         dept: 'IT',         priority: :high,     category: :it,
    status: :resolved,  urgency: 75, source: :web,   description: 'Outlook crashes every time I open it. I cannot access my email at all.' },
  { title: 'Printer in accounting not working',       dept: 'IT',         priority: :medium,   category: :it,
    status: :resolved,  urgency: 55, source: :web,   description: 'The printer on the 3rd floor accounting area is showing offline and nobody can print.' },
  { title: 'Need access to shared drive folder',      dept: 'IT',         priority: :low,      category: :it,
    status: :resolved,  urgency: 30, source: :web,   description: 'I need read access to the Marketing shared folder to collaborate on the Q3 campaign.' },
  { title: 'Software license expired for Adobe',      dept: 'IT',         priority: :medium,   category: :it,
    status: :in_progress, urgency: 60, source: :web, description: 'Adobe Creative Cloud license expired and I cannot access Photoshop or Illustrator for design work.' },
  { title: 'Workstation running extremely slow',      dept: 'IT',         priority: :medium,   category: :it,
    status: :open,      urgency: 50, source: :voice, description: 'My desktop computer has been running very slowly for the past week making it hard to work.' },
  { title: 'Two monitors not detected after update',  dept: 'IT',         priority: :high,     category: :it,
    status: :open,      urgency: 78, source: :web,   description: 'After the Windows update last night neither of my external monitors are being detected.' },
  { title: 'Cannot install required software',        dept: 'IT',         priority: :medium,   category: :it,
    status: :pending,   urgency: 45, source: :web,   description: 'I need to install Python 3.11 for my data analysis work but I do not have admin rights.' },
  # HR tickets
  { title: 'Question about vacation policy',          dept: 'HR',         priority: :low,      category: :hr,
    status: :resolved,  urgency: 20, source: :web,   description: 'I would like to understand how many vacation days I have accumulated and the process to request them.' },
  { title: 'Payroll discrepancy in last paycheck',    dept: 'HR',         priority: :high,     category: :hr,
    status: :in_progress, urgency: 85, source: :web, description: 'My last paycheck was missing the overtime hours I worked during the project deadline last month.' },
  { title: 'Update emergency contact information',    dept: 'HR',         priority: :low,      category: :hr,
    status: :resolved,  urgency: 15, source: :web,   description: 'I need to update my emergency contact information in the HR system.' },
  { title: 'Benefits enrollment deadline question',   dept: 'HR',         priority: :medium,   category: :hr,
    status: :resolved,  urgency: 40, source: :web,   description: 'I missed the open enrollment deadline for health benefits. Is there a way to still enroll?' },
  # Facilities tickets
  { title: 'Air conditioning broken in meeting room', dept: 'Facilities', priority: :high,     category: :facilities,
    status: :resolved,  urgency: 70, source: :web,   description: 'The air conditioning in conference room B on the 2nd floor is not working. Meetings are uncomfortable.' },
  { title: 'Elevator making strange noises',          dept: 'Facilities', priority: :critical, category: :facilities,
    status: :resolved,  urgency: 95, source: :web,   description: 'The main elevator is making loud grinding noises. This may be a safety hazard and needs urgent attention.' },
  { title: 'Coffee machine broken in kitchen',        dept: 'Facilities', priority: :low,      category: :facilities,
    status: :resolved,  urgency: 25, source: :web,   description: 'The espresso machine in the main kitchen is broken and not producing coffee.' },
  { title: 'Lights flickering in open office area',  dept: 'Facilities', priority: :medium,   category: :facilities,
    status: :open,      urgency: 50, source: :web,   description: 'Several overhead lights in the open office area have been flickering for three days.' },
  # Finance tickets
  { title: 'Expense report approval taking too long', dept: 'Finance',    priority: :medium,   category: :finance,
    status: :resolved,  urgency: 45, source: :web,   description: 'My expense report from the client trip two weeks ago has not been approved yet. I need reimbursement.' },
  { title: 'Budget code not found in system',         dept: 'Finance',    priority: :high,     category: :finance,
    status: :in_progress, urgency: 72, source: :web, description: 'The budget code for our new project is not appearing in the finance system when I try to submit invoices.' },
  # Operations tickets
  { title: 'Process documentation outdated',          dept: 'Operations', priority: :low,      category: :operations,
    status: :resolved,  urgency: 20, source: :web,   description: 'The onboarding process documentation on the intranet is outdated and new employees are getting confused.' },
  { title: 'Weekly report not generating correctly',  dept: 'Operations', priority: :medium,   category: :operations,
    status: :open,      urgency: 55, source: :web,   description: 'The automated weekly operations report is missing data from the Facilities department since last Tuesday.' }
]

# Pattern detection spike — 6 similar "slow network" tickets in 2 hours
slow_network_spike = [
  { title: 'Internet connection very slow at desk',              dept: 'IT', priority: :high,   category: :it,
status: :open, urgency: 80, source: :web,   description: 'The internet connection at my workstation has been extremely slow since this morning. Pages take over 30 seconds to load.' },
  { title: 'Network is incredibly slow cannot work',             dept: 'IT', priority: :high,   category: :it,
status: :open, urgency: 83, source: :web,   description: 'Network speed has dropped dramatically. I cannot load any websites or access cloud tools. Completely blocking my work.' },
  { title: 'WiFi speed dropped drastically today',               dept: 'IT', priority: :high,   category: :it,
status: :open, urgency: 77, source: :voice, description: 'WiFi is barely working. Speed test shows 1mbps when we normally have 200mbps. Everything is timing out.' },
  { title: 'Cannot upload files network too slow',               dept: 'IT', priority: :medium, category: :it,
status: :open, urgency: 65, source: :web,   description: 'Trying to upload project files to the shared drive but the connection is too slow. Has been failing for 2 hours.' },
  { title: 'Slow network affecting video calls quality',         dept: 'IT', priority: :high,   category: :it,
status: :open, urgency: 79, source: :web,   description: 'Video calls on Zoom and Teams are constantly dropping due to network slowness. Client meetings are being affected.' },
  { title: 'All cloud services timing out due to slow internet', dept: 'IT', priority: :high,   category: :it,
status: :open, urgency: 85, source: :web,   description: 'Google Workspace, Slack, and all cloud services are timing out. The network appears to be almost completely down.' }
]

workspaces.each do |ws|
  agents    = user_map[ws.slug].values.select(&:role_agent?)
  employees = user_map[ws.slug].values.select(&:role_employee?)
  it_dept   = dept_map[ws.slug]['IT']
  creator   = employees.first || user_map[ws.slug]['emp1']
  ticket_counter = ws.tickets.count

  ticket_templates.each_with_index do |tmpl, _idx|
    ticket_counter += 1
    ticket_num = "TK-#{ticket_counter.to_s.rjust(5, '0')}"
    next if ws.tickets.exists?(ticket_number: ticket_num)

    dept       = dept_map[ws.slug][tmpl[:dept]]
    agent      = agents.sample || user_map[ws.slug]['agent1']
    created_at = random_past(5, 30)
    due_at     = created_at + 8.hours

    ticket = ws.tickets.create!(
      title:         tmpl[:title],
      description:   tmpl[:description],
      ticket_number: ticket_num,
      status:        tmpl[:status],
      priority:      tmpl[:priority],
      category:      tmpl[:category],
      source:        tmpl[:source],
      urgency_score: tmpl[:urgency],
      department:    dept,
      created_by:    creator,
      assigned_to:   agent,
      due_at:        due_at,
      created_at:    created_at,
      updated_at:    created_at,
      ai_metadata: {
        category:      tmpl[:category].to_s,
        priority:      tmpl[:priority].to_s,
        urgency_score: tmpl[:urgency],
        reasoning: {
          category_signals: ['keyword match', 'department context'],
          priority_signals: ["urgency score #{tmpl[:urgency]}", 'user impact'],
          confidence:       rand(0.75..0.98).round(2),
          similar_ticket:   nil
        },
        tags:            ['auto-classified'],
        suggested_agent: agent.email
      }
    )

    if tmpl[:status] == :resolved
      ticket.update_columns(resolved_at: created_at + rand(2..6).hours, updated_at: created_at + rand(2..6).hours)
    end
  end

  # Pattern detection spike — all within 2 hours window
  spike_base = 90.minutes.ago
  slow_network_spike.each_with_index do |tmpl, idx|
    ticket_counter += 1
    ticket_num = "TK-#{ticket_counter.to_s.rjust(5, '0')}"
    next if ws.tickets.exists?(ticket_number: ticket_num)

    agent      = agents.sample || user_map[ws.slug]['agent1']
    created_at = spike_base + (idx * 18).minutes

    ws.tickets.create!(
      title:         tmpl[:title],
      description:   tmpl[:description],
      ticket_number: ticket_num,
      status:        tmpl[:status],
      priority:      tmpl[:priority],
      category:      tmpl[:category],
      source:        tmpl[:source],
      urgency_score: tmpl[:urgency],
      department:    it_dept,
      created_by:    creator,
      assigned_to:   agent,
      due_at:        created_at + 8.hours,
      created_at:    created_at,
      updated_at:    created_at,
      ai_metadata: {
        category: 'it', priority: tmpl[:priority].to_s, urgency_score: tmpl[:urgency],
        reasoning: { category_signals: %w[network slow internet],
                     priority_signals: ['multiple users affected', 'blocking work'],
                     confidence: 0.94, similar_ticket: nil },
        tags: %w[network pattern-spike], suggested_agent: agent.email
      }
    )
  end

  Rails.logger.debug { "  Tickets created for #{ws.name} (#{ticket_counter} total)" }
end

# ── Assets ───────────────────────────────────────────────────
assets_data = [
  { name: 'MacBook Pro 16" M3',       asset_type: :laptop,  status: :active,         risk_score: 15, incident_count: 0,
serial: 'MBP-M3-001', warranty_days: 400 },
  { name: 'Dell XPS 15',              asset_type: :laptop,  status: :active,         risk_score: 42, incident_count: 2,
serial: 'DELL-XPS-002', warranty_days: 120 },
  { name: 'ThinkPad X1 Carbon',       asset_type: :laptop,  status: :in_maintenance, risk_score: 68, incident_count: 3,
serial: 'TP-X1-003', warranty_days: 30 },
  { name: 'HP EliteBook 840',         asset_type: :laptop,  status: :active,         risk_score: 25, incident_count: 1,
serial: 'HP-840-004', warranty_days: 200 },
  { name: 'Dell PowerEdge R740',      asset_type: :server,  status: :active,         risk_score: 78, incident_count: 4,
serial: 'DELL-PE-005', warranty_days: 15 },
  { name: 'HP ProLiant DL380',        asset_type: :server,  status: :active,         risk_score: 55, incident_count: 2,
serial: 'HP-DL-006', warranty_days: 60  },
  { name: 'LG UltraWide 34"',         asset_type: :monitor, status: :active,         risk_score: 10, incident_count: 0,
serial: 'LG-UW-007', warranty_days: 300 },
  { name: 'Dell 27" 4K Monitor',      asset_type: :monitor, status: :active,         risk_score: 20, incident_count: 1,
serial: 'DELL-27-008', warranty_days: 180 },
  { name: 'iPhone 14 Pro',            asset_type: :phone,   status: :active,         risk_score: 12, incident_count: 0,
serial: 'IP14-009', warranty_days: 250 },
  { name: 'Samsung Galaxy S23',       asset_type: :phone,   status: :lost,           risk_score: 90, incident_count: 5,
serial: 'SGS23-010', warranty_days: 80 }
]

workspaces.each do |ws|
  user_map[ws.slug]['it.manager']
  employees = user_map[ws.slug].values.select(&:role_employee?)

  assets_data.each_with_index do |data, idx|
    asset_num = "AST-#{ws.slug.upcase[0..2]}-#{(idx + 1).to_s.rjust(3, '0')}"
    next if ws.assets.exists?(asset_number: asset_num)

    ws.assets.create!(
      name:              data[:name],
      asset_number:      asset_num,
      asset_type:        data[:asset_type],
      status:            data[:status],
      risk_score:        data[:risk_score],
      incident_count:    data[:incident_count],
      serial_number:     "#{data[:serial]}-#{ws.slug[0..2].upcase}",
      warranty_expires_at: Time.current + data[:warranty_days].days,
      assigned_to:       employees.sample,
      department:        dept_map[ws.slug]['IT']
    )
  end
  Rails.logger.debug { "  Assets created for #{ws.name}" }

  # ── Leave Requests ────────────────────────────────────────────
  hr_manager = user_map[ws.slug]['hr.manager']
  user_map[ws.slug].values.select { |u| u.role_employee? || u.role_agent? }

  leave_requests_data = [
    { type: :vacation,   start_offset: 10, end_offset: 17, status: :approved, user_key: 'emp1'   },
    { type: :sick_leave, start_offset: -5, end_offset: -3, status: :approved, user_key: 'emp2'   },
    { type: :personal,   start_offset: 5,  end_offset: 7,  status: :pending,  user_key: 'emp3'   },
    { type: :vacation,   start_offset: 20, end_offset: 30, status: :pending,  user_key: 'agent1' }
  ]

  leave_requests_data.each do |data|
    user       = user_map[ws.slug][data[:user_key]]
    start_date = Date.current + data[:start_offset].days
    end_date   = Date.current + data[:end_offset].days

    next if LeaveRequest.exists?(workspace: ws, user: user, start_date: start_date)
    next if start_date >= end_date

    lr = LeaveRequest.new(
      workspace:    ws,
      user:         user,
      leave_type:   data[:type],
      start_date:   start_date,
      end_date:     end_date,
      status:       data[:status],
      reason:       "Requesting #{data[:type].to_s.humanize} leave for personal reasons."
    )
    lr.approved_by = hr_manager if data[:status] == :approved
    lr.save!
  end
  Rails.logger.debug { "  Leave requests created for #{ws.name}" }
end

# ── Onboarding Plans ──────────────────────────────────────────
onboarding_tasks_templates = [
  { title: 'Complete IT security training',         category: :systems,       order: 1 },
  { title: 'Set up development environment',        category: :setup,         order: 2 },
  { title: 'Meet with direct manager',              category: :team,          order: 3 },
  { title: 'Review company policies and handbook',  category: :systems,       order: 4 },
  { title: 'Access all required tools and systems', category: :setup,         order: 5 },
  { title: 'Complete HR onboarding paperwork',      category: :setup,         order: 6 },
  { title: 'Shadow a senior team member for 1 day', category: :team,          order: 7 },
  { title: 'Complete first independent task',       category: :contributions, order: 8 }
]

workspaces.each do |ws|
  new_employees = [user_map[ws.slug]['emp1'], user_map[ws.slug]['emp3']]

  new_employees.each do |emp|
    next if OnboardingPlan.exists?(workspace: ws, user: emp)

    plan = OnboardingPlan.create!(
      workspace:              ws,
      user:                   emp,
      status:                 :in_progress,
      completion_percentage:  0,
      target_completion_date: 30.days.from_now
    )

    onboarding_tasks_templates.each_with_index do |tmpl, idx|
      completed = idx < 4
      OnboardingTask.create!(
        onboarding_plan: plan,
        title:           tmpl[:title],
        category:        tmpl[:category],
        completed:       completed,
        order_index:     tmpl[:order]
      )
    end

    plan.recalculate_completion!
  end
  Rails.logger.debug { "  Onboarding plans created for #{ws.name}" }

  # ── AI Audit Log Entries ──────────────────────────────────────
  admin = user_map[ws.slug]['admin']

  ai_operations = %w[ticket_classification response_suggestion asset_risk_scoring onboarding_plan]
  10.times do |idx|
    operation  = ai_operations[idx % ai_operations.length]
    created_at = random_past(1, 14)

    AiAuditLog.find_or_create_by!(
      workspace: ws,
      operation: operation,
      created_at: created_at
    ) do |log|
      log.user              = admin
      log.model             = 'gpt-4o'
      log.provider          = 'openai'
      log.prompt            = "Classify this ticket: Sample ticket content for #{operation} operation #{idx}"
      log.response          = '{"category":"it","priority":"high","urgency_score":75,"reasoning":{"category_signals":["network","error"],"priority_signals":["blocking work"],"confidence":0.92}}'
      log.prompt_tokens     = rand(150..400)
      log.completion_tokens = rand(80..200)
      log.total_tokens      = log.prompt_tokens + log.completion_tokens
      log.duration_ms       = rand(800..2800)
      log.confidence_score  = rand(0.75..0.98).round(2)
      log.status            = :success
    end
  end
  Rails.logger.debug { "  AI Audit Log entries created for #{ws.name}" }
end

Rails.logger.debug ''
Rails.logger.debug '==> Seed complete!'
Rails.logger.debug ''
Rails.logger.debug '  WORKSPACE CREDENTIALS:'
Rails.logger.debug '  ──────────────────────────────────────────────────────'
Rails.logger.debug '  PulseDesk Demo (original):'
Rails.logger.debug '    admin@pulsedesk.ai          Password123x  [workspace_admin]'
Rails.logger.debug '    agent@pulsedesk.ai          Password123x  [agent]'
Rails.logger.debug '    hr@pulsedesk.ai             Password123x  [hr_manager]'
Rails.logger.debug '    it@pulsedesk.ai             Password123x  [it_manager]'
Rails.logger.debug '    employee@pulsedesk.ai       Password123x  [employee]'
Rails.logger.debug ''
Rails.logger.debug '  TechCorp workspace:'
Rails.logger.debug '    admin@techcorp.pulsedesk.ai Password123x  [workspace_admin]'
Rails.logger.debug '    agent1@techcorp.pulsedesk.ai Password123x [agent]'
Rails.logger.debug ''
Rails.logger.debug '  HealthCo workspace:'
Rails.logger.debug '    admin@healthco.pulsedesk.ai Password123x  [workspace_admin]'
Rails.logger.debug ''
Rails.logger.debug '  RetailPlus workspace:'
Rails.logger.debug '    admin@retailplus.pulsedesk.ai Password123x [workspace_admin]'
Rails.logger.debug '  ──────────────────────────────────────────────────────'
