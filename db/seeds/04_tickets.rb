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

TICKET_TEMPLATES = [
  # ── IT & Digital Banking ──────────────────────────────────────────────────
  { title: 'Core banking platform unresponsive — all branches down', dept: 'IT & Digital Banking',
    priority: :critical, category: :it, status: :in_progress, urgency: 99, source: :web,
    description: 'Core banking system completely unresponsive across all 40 branches. No transactions can be processed. Revenue and compliance impact ongoing.', created_offset: 0.1 },
  { title: 'Wire transfer gateway timeout — SWIFT messages queued', dept: 'IT & Digital Banking',
    priority: :critical, category: :it, status: :open, urgency: 96, source: :web,
    description: 'Outbound SWIFT wire transfers are queued and not transmitting. Corporate clients awaiting same-day settlement.', created_offset: 0.2 },
  { title: 'Monitoring system flooding alerts — 300 per minute', dept: 'IT & Digital Banking',
    priority: :high, category: :it, status: :in_progress, urgency: 89, source: :web,
    description: 'Infrastructure monitoring is flooding the on-call channel, making it hard to isolate the actual root cause of the core banking outage.', created_offset: 0.15 },
  { title: 'Mobile banking app crashing on login after iOS update', dept: 'IT & Digital Banking',
    priority: :high, category: :it, status: :open, urgency: 87, source: :web,
    description: 'Mobile banking app crashes immediately after entering credentials on iOS 18. Over 200 customer reports in 2 hours.', created_offset: 0.5 },
  { title: 'Multi-factor authentication service down — logins blocked', dept: 'IT & Digital Banking',
    priority: :critical, category: :it, status: :resolved, urgency: 95, source: :web,
    description: 'MFA provider outage blocked all employee and customer logins for 45 minutes this morning.', created_offset: 2 },
  { title: 'Core banking database replication lag detected', dept: 'IT & Digital Banking',
    priority: :high, category: :it, status: :in_progress, urgency: 82, source: :voice,
    description: 'Standby replica is 12 minutes behind primary. Failover reliability at risk if primary fails now.', created_offset: 1 },
  { title: 'Nightly ETL job failing — regulatory reports delayed', dept: 'IT & Digital Banking',
    priority: :high, category: :it, status: :resolved, urgency: 78, source: :web,
    description: 'Overnight data warehouse load failed for the third night this week, delaying the branch performance dashboards.', created_offset: 4 },
  { title: 'Online banking session timing out after 90 seconds', dept: 'IT & Digital Banking',
    priority: :medium, category: :it, status: :resolved, urgency: 58, source: :web,
    description: 'Session timeout was misconfigured after last platform release, logging customers out mid-transaction.', created_offset: 8 },

  # ── Branch Operations ─────────────────────────────────────────────────────
  { title: 'ATM offline — Branch 12 downtown unable to dispense cash', dept: 'Branch Operations',
    priority: :critical, category: :it, status: :open, urgency: 94, source: :web,
    description: 'ATM at Branch 12 has been offline since 8am. Customers lined up unable to withdraw cash.', created_offset: 0.3 },
  { title: 'ATM offline — Branch 7 riverside, third outage this month', dept: 'Branch Operations',
    priority: :high, category: :it, status: :open, urgency: 90, source: :web,
    description: 'This is the third unplanned outage for the Branch 7 ATM in 30 days, all with the same cash-dispenser fault code.', created_offset: 0.4 },
  { title: 'Teller cash drawer reconciliation discrepancy of $1,200', dept: 'Branch Operations',
    priority: :high, category: :operations, status: :resolved, urgency: 80, source: :web,
    description: 'End-of-day till count at Branch 4 was short by $1,200. Awaiting camera footage review.', created_offset: 3 },
  { title: 'Branch 19 closed early — security system malfunction', dept: 'Branch Operations',
    priority: :high, category: :facilities, status: :resolved, urgency: 76, source: :web,
    description: 'Alarm and access control system failure forced early closure of Branch 19 for the afternoon.', created_offset: 6 },
  { title: 'New branch provisioning checklist — systems not ready', dept: 'Branch Operations',
    priority: :medium, category: :operations, status: :in_progress, urgency: 55, source: :web,
    description: 'Branch 22 opens in two weeks; network, POS, and vault systems are still pending installation.', created_offset: 5 },
  { title: 'Safe deposit box access system rejecting valid credentials', dept: 'Branch Operations',
    priority: :medium, category: :it, status: :resolved, urgency: 60, source: :web,
    description: 'Customers with valid safe deposit box keys are being denied access due to a card reader firmware bug.', created_offset: 10 },

  # ── Customer Service ──────────────────────────────────────────────────────
  { title: 'Customer reports unauthorized card charges — possible fraud', dept: 'Customer Service',
    priority: :critical, category: :support, status: :in_progress, urgency: 97, source: :web,
    description: 'Customer disputes 6 charges totaling $2,340 made overnight in a country they have never visited.', created_offset: 0.2 },
  { title: 'Call center wait times exceeding 25 minutes during payroll week', dept: 'Customer Service',
    priority: :high, category: :support, status: :open, urgency: 78, source: :web,
    description: 'Call volume triples on paydays; average hold time has climbed to 25 minutes, well above the 5-minute target.', created_offset: 1 },
  { title: 'Customer unable to reset online banking password', dept: 'Customer Service',
    priority: :low, category: :support, status: :resolved, urgency: 30, source: :web,
    description: 'Password reset link is not arriving in customer inbox; suspected spam filter issue with major email providers.', created_offset: 12 },
  { title: 'Duplicate direct debit charge disputed by customer', dept: 'Customer Service',
    priority: :medium, category: :support, status: :resolved, urgency: 55, source: :web,
    description: 'Mortgage payment was debited twice in the same billing cycle due to a scheduler double-run.', created_offset: 15 },
  { title: 'Elderly customer needs assistance completing digital onboarding', dept: 'Customer Service',
    priority: :low, category: :support, status: :resolved, urgency: 25, source: :voice,
    description: 'Customer called requesting in-branch help completing the new mobile banking enrollment flow.', created_offset: 20 },

  # ── HR ─────────────────────────────────────────────────────────────────────
  { title: 'Payroll error — incorrect tax withholding for 40 employees', dept: 'HR',
    priority: :high, category: :hr, status: :resolved, urgency: 82, source: :web,
    description: 'A configuration error in the payroll system applied the wrong tax bracket to 40 branch employees this cycle.', created_offset: 8 },
  { title: 'AML certification renewal overdue for 15 tellers', dept: 'HR',
    priority: :medium, category: :hr, status: :in_progress, urgency: 62, source: :web,
    description: 'Annual anti-money-laundering training certification has lapsed for 15 tellers across 3 branches.', created_offset: 4 },
  { title: 'New hire background check delayed past start date', dept: 'HR',
    priority: :medium, category: :hr, status: :open, urgency: 58, source: :web,
    description: 'Background check vendor has not returned results for a teller hire whose start date is Monday.', created_offset: 2 },
  { title: 'Benefits enrollment portal error during open enrollment', dept: 'HR',
    priority: :high, category: :hr, status: :resolved, urgency: 74, source: :web,
    description: 'Employees are unable to submit benefits elections; the portal throws a validation error on the dependents step.', created_offset: 6 },
  { title: 'Employee grievance regarding weekend shift scheduling', dept: 'HR',
    priority: :medium, category: :hr, status: :pending, urgency: 50, source: :web,
    description: 'A branch employee has filed a formal complaint about being scheduled for four consecutive weekends.', created_offset: 3 },

  # ── Finance & Treasury ───────────────────────────────────────────────────
  { title: 'End-of-day reconciliation mismatch vs general ledger', dept: 'Finance & Treasury',
    priority: :critical, category: :finance, status: :in_progress, urgency: 93, source: :web,
    description: 'Core banking end-of-day totals do not match the general ledger by $48,000. Books cannot close until resolved.', created_offset: 0.5 },
  { title: 'Treasury liquidity report failing to generate', dept: 'Finance & Treasury',
    priority: :high, category: :finance, status: :open, urgency: 80, source: :web,
    description: 'The daily liquidity coverage ratio report has failed to generate for two consecutive days.', created_offset: 1 },
  { title: 'Foreign exchange rate feed stale for 6 hours', dept: 'Finance & Treasury',
    priority: :high, category: :finance, status: :resolved, urgency: 76, source: :web,
    description: 'FX rates displayed to tellers and online banking were 6 hours stale, risking mispriced currency exchanges.', created_offset: 5 },
  { title: 'Savings account interest rate update not applied', dept: 'Finance & Treasury',
    priority: :high, category: :finance, status: :resolved, urgency: 70, source: :web,
    description: 'The Federal Reserve rate change was not reflected in savings account interest calculations for this statement cycle.', created_offset: 9 },
  { title: 'Vendor invoice payment blocked — budget code missing', dept: 'Finance & Treasury',
    priority: :medium, category: :finance, status: :resolved, urgency: 48, source: :web,
    description: 'A new vendor invoice cannot be processed because the cost center code was never set up in the finance system.', created_offset: 18 },

  # ── Compliance & Risk ────────────────────────────────────────────────────
  { title: 'Suspicious wire transfer pattern flagged for AML review', dept: 'Compliance & Risk',
    priority: :critical, category: :finance, status: :in_progress, urgency: 96, source: :web,
    description: 'Automated monitoring flagged a structuring pattern across 4 accounts, each transferring just under the $10,000 reporting threshold.', created_offset: 0.3 },
  { title: 'OFAC sanctions list screening delayed by vendor outage', dept: 'Compliance & Risk',
    priority: :critical, category: :operations, status: :resolved, urgency: 92, source: :web,
    description: 'The sanctions screening vendor was down for 3 hours, delaying mandatory checks on new account openings.', created_offset: 1 },
  { title: 'Potential data exposure — customer PII in error logs', dept: 'Compliance & Risk',
    priority: :critical, category: :it, status: :resolved, urgency: 95, source: :web,
    description: 'A misconfigured logging level briefly wrote unmasked account numbers to application logs before being caught.', created_offset: 7 },
  { title: 'KYC documentation expired for 220 active accounts', dept: 'Compliance & Risk',
    priority: :high, category: :operations, status: :open, urgency: 84, source: :web,
    description: 'Periodic KYC refresh identified 220 accounts with expired identification documents on file.', created_offset: 2 },
  { title: 'SOX audit evidence collection deadline in 5 days', dept: 'Compliance & Risk',
    priority: :high, category: :operations, status: :in_progress, urgency: 81, source: :web,
    description: 'Annual SOX controls audit requires evidence packages from 6 departments before Friday deadline.', created_offset: 3 },
  { title: 'Customer data retention policy violation identified', dept: 'Compliance & Risk',
    priority: :high, category: :hr, status: :in_progress, urgency: 79, source: :web,
    description: 'Internal audit found customer records retained 2 years past the policy-mandated deletion window.', created_offset: 4 },

  # ── Facilities ─────────────────────────────────────────────────────────────
  { title: 'Vault door mechanism jammed at Branch 3', dept: 'Facilities',
    priority: :critical, category: :facilities, status: :resolved, urgency: 93, source: :web,
    description: 'The main vault door mechanism jammed overnight, delaying branch opening and cash operations.', created_offset: 10 },
  { title: 'HVAC failure at headquarters during heatwave', dept: 'Facilities',
    priority: :high, category: :facilities, status: :resolved, urgency: 75, source: :web,
    description: 'Air conditioning failed at headquarters during a 38°C heatwave, affecting 200 employees.', created_offset: 6 },
  { title: 'Parking garage security cameras offline', dept: 'Facilities',
    priority: :medium, category: :facilities, status: :resolved, urgency: 55, source: :web,
    description: '8 cameras in the headquarters parking garage went offline after a power surge.', created_offset: 15 },
  { title: 'Elevator maintenance overdue at headquarters', dept: 'Facilities',
    priority: :medium, category: :facilities, status: :open, urgency: 50, source: :web,
    description: 'Scheduled elevator maintenance is 3 weeks overdue; occasional grinding noise reported by staff.', created_offset: 12 },
  { title: 'ATM vestibule lighting out at Branch 9', dept: 'Facilities',
    priority: :low, category: :facilities, status: :resolved, urgency: 30, source: :web,
    description: 'Exterior lighting at the Branch 9 ATM vestibule has been out for a week, raising customer safety concerns after dark.', created_offset: 20 },

  # ── General ────────────────────────────────────────────────────────────────
  { title: 'Ticket misrouted — needs reclassification', dept: 'General',
    priority: :low, category: :general, status: :resolved, urgency: 20, source: :web,
    description: 'Ticket was submitted under the wrong category and needs to be reassigned to the correct department.', created_offset: 25 },
  { title: 'Combined badge and desk relocation request', dept: 'General',
    priority: :low, category: :general, status: :resolved, urgency: 22, source: :web,
    description: 'Employee submitted a combined request for a new badge and a desk relocation in one ticket.', created_offset: 28 },
  { title: 'Employee suggestion — consolidate approval workflow steps', dept: 'General',
    priority: :low, category: :general, status: :resolved, urgency: 15, source: :web,
    description: 'An employee suggested consolidating three separate approval steps into a single workflow.', created_offset: 30 }
].freeze

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
  ['Projector not working in branch conference room', :medium, :facilities, :resolved],
  ['Two-factor auth setup help', :low, :it, :resolved],
  ['Report data looks incorrect', :medium, :operations, :open],
  ['Keyboard not working properly', :low, :it, :resolved],
  ['Need extra monitor at desk', :low, :it, :pending],
  ['HR policy clarification needed', :low, :hr, :resolved],
  ['Internet slow at branch teller station', :medium, :it, :resolved],
  ['Receipt printer paper jam', :low, :facilities, :resolved],
  ['Software license renewal needed', :medium, :it, :in_progress],
  ['Branch security door code not working', :high, :facilities, :resolved]
].freeze

ticket_counter = 0

Workspace.find_each do |ws|
  depts    = Department.where(workspace: ws).index_by(&:name)
  slas     = SlaPolicy.where(workspace: ws).index_by { |s| s.priority.to_s }
  users    = User.where(workspace: ws)
  agents   = users.select(&:role_agent?)
  creators = users.select { |u| u.role_employee? || u.role_agent? }
  admin    = users.find(&:role_workspace_admin?)

  agent   = agents.first || admin
  creator = creators.first || admin

  # Narrative tickets
  TICKET_TEMPLATES.each do |tmpl|
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
  filler_count = 150
  filler_count.times do |idx|
    ticket_counter += 1
    tmpl       = FILLER_TITLES[idx % FILLER_TITLES.size]
    dept       = depts.values.sample
    sla        = slas[tmpl[1].to_s]
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