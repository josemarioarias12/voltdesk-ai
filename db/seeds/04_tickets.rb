# frozen_string_literal: true

Rails.logger.debug '  Creating tickets with historical timestamps...'

# Helpers
def business_day_ago(days)
  date = Time.current
  days_counted = 0
  while days_counted < days
    date -= 1.day
    days_counted += 1 unless [0, 6].include?(date.wday)
  end
  date + rand(8..18).hours + rand(0..59).minutes
end

def ticket_due_at(created_at, priority)
  hours = { 'critical' => 4, 'high' => 8, 'medium' => 24, 'low' => 72 }
  created_at + hours.fetch(priority.to_s, 24).hours
end

def resolved_at_for(created_at, priority)
  max_hours = { 'critical' => 3, 'high' => 6, 'medium' => 20, 'low' => 48 }
  created_at + rand(1..max_hours.fetch(priority.to_s, 8)).hours
end

TICKET_TEMPLATES = {
  'techcorp' => [
    { title: 'Database server unreachable — production down', dept: 'IT Infrastructure',
      priority: :critical, category: :it, status: :in_progress, urgency: 98, source: :web,
      description: 'Production database is completely unreachable. All services depending on it are down. Affecting 120 users.', created_offset: 0.08 },
    { title: 'API timeout errors across all microservices', dept: 'IT Infrastructure',
      priority: :critical, category: :it, status: :in_progress, urgency: 94, source: :web,
      description: 'All API endpoints returning 504 timeout. Root cause likely the DB outage.', created_offset: 0.1 },
    { title: 'Login failing for all users — authentication broken', dept: 'IT Infrastructure',
      priority: :critical, category: :it, status: :open, urgency: 96, source: :web,
      description: 'SSO authentication is failing. No user can log in to any internal system.', created_offset: 0.12 },
    { title: 'Reports not loading — dashboard blank', dept: 'Software Engineering',
      priority: :high, category: :it, status: :open, urgency: 85, source: :web,
      description: 'Executive dashboards are blank. Reports service cannot reach the database.', created_offset: 0.15 },
    { title: 'Payment processing stuck — transactions queued', dept: 'Finance',
      priority: :critical, category: :finance, status: :open, urgency: 97, source: :web,
      description: 'All payment transactions are queued and not processing. Revenue impact.', created_offset: 0.13 },
    { title: 'Monitoring alerts flooding — 200+ alerts per minute', dept: 'IT Infrastructure',
      priority: :high, category: :it, status: :in_progress, urgency: 88, source: :web,
      description: 'Monitoring system is flooding with alerts. Hard to identify root cause.', created_offset: 0.11 },
    { title: 'VPN connection dropping for remote workers', dept: 'IT Infrastructure',
      priority: :high, category: :it, status: :open, urgency: 79, source: :web,
      description: 'Remote employees cannot maintain stable VPN connections since this morning.', created_offset: 2 },
    { title: 'Email client crashes on startup after update', dept: 'IT Infrastructure',
      priority: :medium, category: :it, status: :resolved, urgency: 60, source: :web,
      description: 'Outlook crashing after last Windows update on 15 machines.', created_offset: 5 },
    { title: 'Software license expired for Adobe CC', dept: 'IT Infrastructure',
      priority: :medium, category: :it, status: :resolved, urgency: 55, source: :web,
      description: 'Adobe Creative Cloud license expired. Design team cannot work.', created_offset: 8 },
    { title: 'Workstation extremely slow after update', dept: 'IT Infrastructure',
      priority: :medium, category: :it, status: :resolved, urgency: 50, source: :voice,
      description: 'Desktop running very slowly after automatic Windows update.', created_offset: 12 },
    { title: 'Cannot install Python 3.11 — no admin rights', dept: 'Software Engineering',
      priority: :low, category: :it, status: :resolved, urgency: 30, source: :web,
      description: 'Developer needs Python 3.11 for data pipeline but lacks admin rights.', created_offset: 15 },
    { title: 'Payroll discrepancy in last paycheck', dept: 'HR',
      priority: :high, category: :hr, status: :resolved, urgency: 82, source: :web,
      description: 'Overtime hours not reflected in last paycheck. Employee requesting correction.', created_offset: 10 },
    { title: 'New employee onboarding access request', dept: 'HR',
      priority: :medium, category: :hr, status: :resolved, urgency: 45, source: :web,
      description: 'New hire needs access to 8 systems before start date next Monday.', created_offset: 18 },
    { title: 'Air conditioning broken in main conference room', dept: 'Facilities',
      priority: :high, category: :facilities, status: :resolved, urgency: 70, source: :web,
      description: 'Conference room A AC not working. Executive meeting scheduled tomorrow.', created_offset: 20 },
    { title: 'Elevator making grinding noises — safety concern', dept: 'Facilities',
      priority: :critical, category: :facilities, status: :resolved, urgency: 95, source: :web,
      description: 'Main elevator making loud grinding sounds. Potential safety hazard.', created_offset: 25 },
    { title: 'Budget code not found in finance system', dept: 'Finance',
      priority: :high, category: :finance, status: :in_progress, urgency: 72, source: :web,
      description: 'New project budget code missing from system. Cannot submit invoices.', created_offset: 3 },
    { title: 'Weekly operations report missing Facilities data', dept: 'Operations',
      priority: :medium, category: :operations, status: :open, urgency: 55, source: :web,
      description: 'Automated weekly report missing Facilities data since last Tuesday.', created_offset: 1 },
    { title: 'Access to shared drive folder needed', dept: 'IT Infrastructure',
      priority: :low, category: :it, status: :resolved, urgency: 25, source: :web,
      description: 'Marketing team needs read access to Q3 campaign shared folder.', created_offset: 30 },
    { title: 'Two monitors not detected after Windows update', dept: 'IT Infrastructure',
      priority: :high, category: :it, status: :resolved, urgency: 78, source: :web,
      description: 'External monitors not detected after last night Windows update.', created_offset: 22 },
    { title: 'Printer in accounting not responding', dept: 'IT Infrastructure',
      priority: :medium, category: :it, status: :resolved, urgency: 55, source: :web,
      description: 'Accounting floor printer showing offline. 12 people cannot print.', created_offset: 35 }
  ],
  'healthco' => [
    { title: 'Medical equipment malfunction — MRI machine offline', dept: 'IT',
      priority: :critical, category: :it, status: :in_progress, urgency: 99, source: :web,
      description: 'MRI machine in radiology is offline. 8 patient appointments need rescheduling.', created_offset: 1 },
    { title: 'Patient records system slow — appointments delayed', dept: 'IT',
      priority: :high, category: :it, status: :in_progress, urgency: 88, source: :web,
      description: 'EHR system response time over 30 seconds. Doctors cannot access records.', created_offset: 2 },
    { title: 'Nurse call system not responding on floor 3', dept: 'Nursing',
      priority: :critical, category: :facilities, status: :open, urgency: 97, source: :web,
      description: 'Nurse call system completely down on 3rd floor. Patient safety risk.', created_offset: 0.5 },
    { title: 'Medication dispensing machine error', dept: 'Nursing',
      priority: :high, category: :it, status: :resolved, urgency: 90, source: :web,
      description: 'Automated dispensing machine showing error codes. Pharmacy workflow impacted.', created_offset: 5 },
    { title: 'HR leave request — maternity leave approval needed', dept: 'HR',
      priority: :medium, category: :hr, status: :pending, urgency: 60, source: :web,
      description: 'Nurse requesting 12-week maternity leave starting next month.', created_offset: 3 },
    { title: 'Staff scheduling conflict next week', dept: 'HR',
      priority: :high, category: :hr, status: :open, urgency: 75, source: :web,
      description: '3 nurses requested same week off. Minimum coverage requirements at risk.', created_offset: 4 },
    { title: 'Air purifier maintenance overdue in ICU', dept: 'Facilities',
      priority: :critical, category: :facilities, status: :open, urgency: 95, source: :web,
      description: 'ICU air purification system maintenance 2 weeks overdue. Compliance risk.', created_offset: 6 },
    { title: 'Biomedical equipment calibration expired', dept: 'IT',
      priority: :high, category: :it, status: :resolved, urgency: 82, source: :web,
      description: '5 biomedical devices have expired calibration certificates.', created_offset: 10 },
    { title: 'Payroll adjustment for overtime during emergency', dept: 'HR',
      priority: :high, category: :hr, status: :resolved, urgency: 78, source: :web,
      description: '15 nurses worked emergency overtime last weekend. Payroll adjustment needed.', created_offset: 12 },
    { title: 'Conference room booking system not working', dept: 'IT',
      priority: :medium, category: :it, status: :resolved, urgency: 45, source: :web,
      description: 'Room booking system returning errors. Staff using paper sign-ups.', created_offset: 15 },
    { title: 'HVAC system in pharmacy making noise', dept: 'Facilities',
      priority: :medium, category: :facilities, status: :resolved, urgency: 50, source: :web,
      description: 'Loud rattling noise from pharmacy HVAC. Disturbing medication preparation.', created_offset: 20 },
    { title: 'New doctor onboarding — system access request', dept: 'HR',
      priority: :medium, category: :hr, status: :resolved, urgency: 55, source: :web,
      description: 'New cardiologist joining Monday. Needs EHR, PACS, and scheduling access.', created_offset: 25 },
    { title: 'Security badge not working for night shift staff', dept: 'IT',
      priority: :high, category: :it, status: :resolved, urgency: 80, source: :web,
      description: '3 night shift nurses badges not scanning. Access control issue.', created_offset: 18 },
    { title: 'Sterilization equipment error code E-44', dept: 'Nursing',
      priority: :critical, category: :facilities, status: :resolved, urgency: 93, source: :web,
      description: 'Surgical sterilization autoclave showing error E-44. OR schedule at risk.', created_offset: 30 },
    { title: 'Network printer in nurses station offline', dept: 'IT',
      priority: :medium, category: :it, status: :resolved, urgency: 40, source: :web,
      description: 'Floor 2 nurses station printer offline. Prescription printing affected.', created_offset: 35 }
  ],
  'retailplus' => [
    { title: 'POS terminal offline — Store 12 checkout down', dept: 'IT',
      priority: :critical, category: :it, status: :open, urgency: 98, source: :web,
      description: 'All 4 POS terminals at Store 12 are offline. Cannot process any transactions.', created_offset: 0.1 },
    { title: 'POS terminal offline — Store 7 checkout down', dept: 'IT',
      priority: :critical, category: :it, status: :open, urgency: 97, source: :web,
      description: 'Store 7 POS terminals offline since 9am. Long queues forming.', created_offset: 0.15 },
    { title: 'POS terminal offline — Store 3 partial outage', dept: 'IT',
      priority: :critical, category: :it, status: :open, urgency: 95, source: :web,
      description: '2 of 3 POS terminals at Store 3 offline. One lane operating.', created_offset: 0.2 },
    { title: 'POS terminal offline — Store 19 all terminals down', dept: 'IT',
      priority: :critical, category: :it, status: :open, urgency: 96, source: :web,
      description: 'All POS terminals at Store 19 crashed simultaneously after update.', created_offset: 0.25 },
    { title: 'POS terminal offline — Store 5 payment errors', dept: 'IT',
      priority: :high, category: :it, status: :open, urgency: 90, source: :web,
      description: 'Store 5 POS accepting cash only. Card payment system failing.', created_offset: 0.3 },
    { title: 'POS terminal offline — Store 23 system frozen', dept: 'IT',
      priority: :high, category: :it, status: :open, urgency: 88, source: :web,
      description: 'Store 23 POS system frozen and unresponsive. Requires hard reset.', created_offset: 0.35 },
    { title: 'POS terminal offline — Store 8 barcode scanner issue', dept: 'IT',
      priority: :high, category: :it, status: :in_progress, urgency: 85, source: :web,
      description: 'Barcode scanners not communicating with POS at Store 8.', created_offset: 0.4 },
    { title: 'POS terminal offline — Store 15 receipt printer jam', dept: 'IT',
      priority: :medium, category: :it, status: :in_progress, urgency: 70, source: :web,
      description: 'Receipt printers jammed at Store 15. POS workflow blocked.', created_offset: 0.45 },
    { title: 'Inventory sync failing — stock levels outdated', dept: 'Store Operations',
      priority: :high, category: :it, status: :open, urgency: 82, source: :web,
      description: 'Inventory management system not syncing with stores since last night.', created_offset: 1 },
    { title: 'Online order fulfillment system down', dept: 'Logistics',
      priority: :critical, category: :it, status: :in_progress, urgency: 94, source: :web,
      description: 'E-commerce fulfillment integration offline. Orders piling up.', created_offset: 0.5 },
    { title: 'Staff scheduling app not loading for managers', dept: 'HR',
      priority: :high, category: :hr, status: :resolved, urgency: 75, source: :web,
      description: 'Store managers cannot access scheduling app to publish next week shifts.', created_offset: 5 },
    { title: 'Payroll issue — holiday hours not calculated', dept: 'Finance',
      priority: :high, category: :finance, status: :resolved, urgency: 80, source: :web,
      description: 'Holiday premium pay not calculated correctly for 45 part-time employees.', created_offset: 8 },
    { title: 'Refrigeration unit alarm in Store 4', dept: 'Facilities',
      priority: :critical, category: :facilities, status: :resolved, urgency: 96, source: :web,
      description: 'Refrigeration unit alarm triggered in Store 4. Food safety risk.', created_offset: 12 },
    { title: 'Security camera offline in parking lot', dept: 'Facilities',
      priority: :high, category: :facilities, status: :resolved, urgency: 70, source: :web,
      description: '6 parking lot security cameras offline after power surge.', created_offset: 20 },
    { title: 'New employee badge activation request', dept: 'HR',
      priority: :low, category: :hr, status: :resolved, urgency: 25, source: :web,
      description: '5 new seasonal hires need badge activation before weekend.', created_offset: 25 }
  ],
  'startupai' => [
    { title: 'CI/CD pipeline failing on main branch', dept: 'Engineering',
      priority: :critical, category: :it, status: :in_progress, urgency: 95, source: :web,
      description: 'GitHub Actions pipeline failing for 2 hours. No deployments possible.', created_offset: 1 },
    { title: 'Production API returning 500 errors intermittently', dept: 'Engineering',
      priority: :high, category: :it, status: :open, urgency: 88, source: :web,
      description: '5% of API requests returning 500. Affecting paying customers.', created_offset: 0.5 },
    { title: 'Database connection pool exhausted', dept: 'Engineering',
      priority: :high, category: :it, status: :resolved, urgency: 85, source: :web,
      description: 'Postgres connection pool hitting max connections under load.', created_offset: 3 },
    { title: 'Staging environment not deploying', dept: 'Engineering',
      priority: :medium, category: :it, status: :resolved, urgency: 60, source: :web,
      description: 'Staging deployment stuck. QA team blocked from testing.', created_offset: 5 },
    { title: 'Slack integration stopped posting notifications', dept: 'Product',
      priority: :medium, category: :it, status: :open, urgency: 55, source: :web,
      description: 'Slack webhook notifications stopped working after Slack API update.', created_offset: 2 },
    { title: 'Customer data export feature broken', dept: 'Engineering',
      priority: :high, category: :it, status: :in_progress, urgency: 80, source: :web,
      description: 'CSV export returning empty files. Compliance deadline in 2 days.', created_offset: 4 },
    { title: 'New engineer laptop setup request', dept: 'HR',
      priority: :medium, category: :hr, status: :resolved, urgency: 45, source: :web,
      description: '3 new engineers starting Monday. MacBook Pro and access setup needed.', created_offset: 10 },
    { title: 'AWS cost spike — unplanned resource usage', dept: 'Engineering',
      priority: :high, category: :finance, status: :resolved, urgency: 78, source: :web,
      description: 'AWS bill 340% above budget this month. Rogue EC2 instances detected.', created_offset: 15 },
    { title: 'Investor demo environment needs reset', dept: 'Product',
      priority: :critical, category: :it, status: :resolved, urgency: 92, source: :web,
      description: 'Demo environment has corrupted data. Series A pitch is tomorrow morning.', created_offset: 20 },
    { title: 'Team lunch expense report not submitting', dept: 'Finance',
      priority: :low, category: :finance, status: :resolved, urgency: 20, source: :web,
      description: 'Expense reporting tool rejecting submissions over $200.', created_offset: 30 },
    { title: 'Office WiFi dropping every 30 minutes', dept: 'Engineering',
      priority: :high, category: :it, status: :resolved, urgency: 76, source: :web,
      description: 'WiFi router needs restart every 30 min. Engineering team productivity hit.', created_offset: 22 },
    { title: 'On-call rotation not configured in PagerDuty', dept: 'Engineering',
      priority: :high, category: :operations, status: :resolved, urgency: 72, source: :web,
      description: 'On-call schedule missing for next month. Incident response at risk.', created_offset: 25 }
  ],
  'consultingpro' => [
    { title: 'Client portal access expired for Acme Corp', dept: 'IT',
      priority: :high, category: :it, status: :open, urgency: 85, source: :web,
      description: 'Acme Corp client cannot access their portal. Contract renewal meeting tomorrow.', created_offset: 1 },
    { title: 'Confidential report leaked via email — security incident', dept: 'Legal & Compliance',
      priority: :critical, category: :it, status: :in_progress, urgency: 99, source: :web,
      description: 'Sensitive client report sent to wrong email address. GDPR breach potential.', created_offset: 0.5 },
    { title: 'Document management system search broken', dept: 'IT',
      priority: :high, category: :it, status: :resolved, urgency: 80, source: :web,
      description: 'SharePoint search not returning results. Consultants cannot find documents.', created_offset: 5 },
    { title: 'Video conferencing issues during client presentation', dept: 'IT',
      priority: :critical, category: :it, status: :resolved, urgency: 95, source: :web,
      description: 'Zoom dropping during Fortune 500 client presentation. Audio completely lost.', created_offset: 8 },
    { title: 'Employee data retention audit request', dept: 'Legal & Compliance',
      priority: :high, category: :hr, status: :in_progress, urgency: 82, source: :web,
      description: 'Regulatory audit requires proof of data retention policy compliance.', created_offset: 2 },
    { title: 'GDPR data deletion request — former employee', dept: 'Legal & Compliance',
      priority: :high, category: :hr, status: :resolved, urgency: 88, source: :web,
      description: 'Former employee invoking right to erasure under GDPR Article 17.', created_offset: 10 },
    { title: 'SOC 2 audit evidence collection', dept: 'Legal & Compliance',
      priority: :high, category: :operations, status: :in_progress, urgency: 85, source: :web,
      description: 'Annual SOC 2 Type II audit. Evidence collection deadline in 5 days.', created_offset: 3 },
    { title: 'Billing system not generating invoices', dept: 'Finance',
      priority: :critical, category: :finance, status: :resolved, urgency: 96, source: :web,
      description: 'Invoice generation failing. Month-end billing cycle at risk.', created_offset: 12 },
    { title: 'Consultant timesheet system error', dept: 'Finance',
      priority: :high, category: :finance, status: :resolved, urgency: 78, source: :web,
      description: 'Timesheet system rejecting entries for Q4 billable hours.', created_offset: 15 },
    { title: 'New partner onboarding — full access setup', dept: 'HR',
      priority: :medium, category: :hr, status: :resolved, urgency: 60, source: :web,
      description: 'New partner joining. Needs access to all client portals and systems.', created_offset: 20 },
    { title: 'Office lease renewal documentation needed', dept: 'Legal & Compliance',
      priority: :medium, category: :facilities, status: :resolved, urgency: 55, source: :web,
      description: 'Lease renewal docs need legal review before signing deadline.', created_offset: 25 },
    { title: 'Backup failure — client data at risk', dept: 'IT',
      priority: :critical, category: :it, status: :resolved, urgency: 97, source: :web,
      description: 'Nightly backup job has been failing silently for 5 days. Immediate fix needed.', created_offset: 30 }
  ]
}.freeze

# Historical filler tickets to reach 500+ total
FILLER_TITLES = [
  ['Password reset request', :low, :it, :resolved],
  ['Cannot access shared folder', :low, :it, :resolved],
  ['Software update needed', :medium, :it, :resolved],
  ['New employee access setup', :medium, :hr, :resolved],
  ['Meeting room not available', :low, :facilities, :resolved],
  ['Expense report approval', :medium, :finance, :resolved],
  ['Laptop battery not charging', :medium, :it, :resolved],
  ['VPN access for new contractor', :medium, :it, :resolved],
  ['Payroll question about benefits', :low, :hr, :resolved],
  ['Office supplies request', :low, :operations, :resolved],
  ['Projector not working in room B', :medium, :facilities, :resolved],
  ['Two-factor auth setup help', :low, :it, :resolved],
  ['Report data looks incorrect', :medium, :operations, :open],
  ['Keyboard not working properly', :low, :it, :resolved],
  ['Need extra monitor at desk', :low, :it, :pending],
  ['HR policy clarification needed', :low, :hr, :resolved],
  ['Internet slow at desk 4B', :medium, :it, :resolved],
  ['Printer paper jam clearing', :low, :facilities, :resolved],
  ['Software license renewal needed', :medium, :it, :in_progress],
  ['Security door code not working', :high, :facilities, :resolved]
].freeze

ticket_counter = 0

Workspace.find_each do |ws|
  next if ws.slug == 'demo'

  depts    = Department.where(workspace: ws).index_by(&:name)
  slas     = SlaPolicy.where(workspace: ws).index_by { |s| s.priority.to_s }
  users    = User.where(workspace: ws)
  agents   = users.select(&:role_agent?)
  creators = users.select { |u| u.role_employee? || u.role_agent? }
  admin    = users.find(&:role_workspace_admin?)

  agent   = agents.first || admin
  creator = creators.first || admin

  templates = TICKET_TEMPLATES[ws.slug] || TICKET_TEMPLATES['techcorp']

  # Narrative tickets
  templates.each do |tmpl|
    ticket_counter += 1
    dept       = depts.values.find { |d| d.name == tmpl[:dept] } || depts.values.first
    sla        = slas[tmpl[:priority].to_s]
    created_at = if tmpl[:created_offset] < 1
                   Time.current - tmpl[:created_offset].hours
                 else
                   business_day_ago(tmpl[:created_offset].to_i)
                 end
    due_at = ticket_due_at(created_at, tmpl[:priority])

    ticket = Ticket.create!(
      workspace:     ws,
      ticket_number: "TK-#{ticket_counter.to_s.rjust(5, '0')}",
      title:         tmpl[:title],
      description:   tmpl[:description],
      status:        tmpl[:status],
      priority:      tmpl[:priority],
      category:      tmpl[:category],
      source:        tmpl[:source],
      urgency_score: tmpl[:urgency],
      department:    dept,
      sla_policy:    sla,
      created_by:    creator,
      assigned_to:   agent,
      due_at:        due_at,
      created_at:    created_at,
      updated_at:    created_at,
      ai_metadata: {
        'category'      => tmpl[:category].to_s,
        'priority'      => tmpl[:priority].to_s,
        'urgency_score' => tmpl[:urgency],
        'confidence'    => rand(0.72..0.98).round(2),
        'tags'          => ['auto-classified'],
        'reasoning'     => {
          'category_signals' => ['keyword match', 'department context'],
          'priority_signals' => ["urgency score #{tmpl[:urgency]}", 'user impact']
        }
      }
    )

    next unless tmpl[:status] == :resolved

    ticket.update_columns(
      resolved_at: resolved_at_for(created_at, tmpl[:priority].to_s),
      updated_at:  created_at + 1.hour
    )
  end

  # Filler tickets for historical volume (spread over 60 days)
  filler_count = ws.slug == 'consultingpro' ? 98 : 88
  filler_count.times do |idx|
    ticket_counter += 1
    tmpl       = FILLER_TITLES[idx % FILLER_TITLES.size]
    dept       = depts.values.sample
    sla        = slas[tmpl[1].to_s]
    # Spread over 60 days — more on weekdays (ratio 3:1)
    raw_day    = rand(1..60)
    created_at = business_day_ago(raw_day)
    due_at     = ticket_due_at(created_at, tmpl[1])

    ticket = Ticket.create!(
      workspace:     ws,
      ticket_number: "TK-#{ticket_counter.to_s.rjust(5, '0')}",
      title:         "#{tmpl[0]} ##{idx + 1}",
      description:   "User reported: #{tmpl[0].downcase}. Requires attention from #{dept.name} team.",
      status:        tmpl[3],
      priority:      tmpl[1],
      category:      tmpl[2],
      source:        %i[web email voice].sample,
      urgency_score: rand(20..85),
      department:    dept,
      sla_policy:    sla,
      created_by:    creator,
      assigned_to:   agent,
      due_at:        due_at,
      created_at:    created_at,
      updated_at:    created_at,
      ai_metadata: {
        'category'   => tmpl[2].to_s,
        'priority'   => tmpl[1].to_s,
        'confidence' => rand(0.65..0.95).round(2),
        'tags'       => ['auto-classified']
      }
    )

    next unless tmpl[3] == :resolved

    ticket.update_columns(
      resolved_at: resolved_at_for(created_at, tmpl[1].to_s),
      updated_at:  created_at + rand(2..8).hours
    )
  end

  Rails.logger.debug { "  Tickets created for #{ws.name}: #{Ticket.where(workspace: ws).count}" }
end

Rails.logger.debug { "  Tickets total: #{Ticket.count}" }
