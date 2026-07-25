# frozen_string_literal: true

Rails.logger.debug '  Creating HR data (leave requests, onboarding, surveys)...'

ONBOARDING_TASKS = [
  { title: 'Complete IT security training',          category: :systems,   order: 1 },
  { title: 'Set up workstation and development env', category: :setup,   order: 2 },
  { title: 'Meet with direct manager',               category: :team,   order: 3 },
  { title: 'Review company policies and handbook',   category: :systems,   order: 4 },
  { title: 'Access all required tools and systems',  category: :setup,   order: 5 },
  { title: 'Complete HR onboarding paperwork',       category: :setup,   order: 6 },
  { title: 'Shadow a senior team member',            category: :team,   order: 7 },
  { title: 'Complete first independent task',        category: :contributions, order: 8 }
].freeze

Workspace.find_each do |ws|
  users      = User.where(workspace: ws)
  hr_manager = users.find(&:role_hr_manager?)
  employees  = users.select { |u| u.role_employee? || u.role_agent? }

  customer_service = Department.find_by(workspace: ws, name: 'Customer Service')
  if customer_service
    LeavePolicy.find_or_create_by!(workspace: ws, department: customer_service, leave_type: nil) do |policy|
      policy.max_concurrent = 2
      policy.min_notice_days = 7
      policy.requires_second_approval = true
      policy.second_approval_threshold_days = 5
    end
  end

  leave_scenarios = [
    { user_key: 0, type: :vacation,   start_offset: 10,  end_offset: 17,  status: :approved,
      medical_notes: nil },
    { user_key: 1, type: :sick_leave, start_offset: -5,  end_offset: -3,  status: :approved,
      medical_notes: 'Doctor diagnosed acute condition. Rest required.' },
    { user_key: 2, type: :personal,   start_offset: 5,   end_offset: 7,   status: :pending,
      medical_notes: nil },
    { user_key: 0, type: :maternity,  start_offset: 30,  end_offset: 120, status: :pending,
      medical_notes: 'OB-GYN confirms pregnancy week 28. Maternity leave approved.' },
    { user_key: 1, type: :vacation,   start_offset: 20,  end_offset: 27,  status: :pending,
      medical_notes: nil },
    { user_key: 2, type: :sick_leave, start_offset: -10, end_offset: -8,  status: :approved,
      medical_notes: 'Minor surgical procedure required. 3 days recovery.' }
  ]

  leave_scenarios.each do |scenario|
    user       = employees[scenario[:user_key] % employees.size]
    start_date = Date.current + scenario[:start_offset].days
    end_date   = Date.current + scenario[:end_offset].days
    next if start_date >= end_date

    lr = LeaveRequest.new(
      workspace:    ws,
      user:         user,
      leave_type:   scenario[:type],
      start_date:   start_date,
      end_date:     end_date,
      status:       scenario[:status],
      reason:       "Requesting #{scenario[:type].to_s.humanize} leave.",
      medical_notes: scenario[:medical_notes]
    )
    lr.approved_by = hr_manager if scenario[:status] == :approved
    lr.save!
  end

  Rails.logger.debug { "  LeaveRequests for #{ws.name}: #{LeaveRequest.where(workspace: ws).count}" }

  # Onboarding Plans — 3 employees in different stages
  employees.first(3).each_with_index do |emp, idx|
    completed_tasks = [8, 4, 1][idx]

    plan = OnboardingPlan.create!(
      workspace:             ws,
      user:                  emp,
      status:                idx.zero? ? :completed : :in_progress,
      completion_percentage: 0,
      target_completion_date: (30 - (idx * 10)).days.from_now
    )

    ONBOARDING_TASKS.each_with_index do |tmpl, task_idx|
      OnboardingTask.create!(
        onboarding_plan: plan,
        title:           tmpl[:title],
        category:        tmpl[:category],
        completed:       task_idx < completed_tasks,
        order_index:     tmpl[:order]
      )
    end

    plan.recalculate_completion!
  end

  Rails.logger.debug { "  OnboardingPlans for #{ws.name}: #{OnboardingPlan.where(workspace: ws).count}" }

  # Satisfaction Surveys — Customer Service shows a sentiment drop for trending demo
  tickets    = Ticket.where(workspace: ws).where.not(status: :open).limit(30)
  depts      = Department.where(workspace: ws).index_by(&:name)
  submitters = employees

  tickets.each_with_index do |ticket, idx|
    next if TicketSatisfactionSurvey.exists?(ticket: ticket)

    sentiment = if ticket.department&.name == 'Customer Service'
                  rand(-0.8..-0.2).round(2)
                else
                  rand(0.1..0.95).round(2)
                end

    TicketSatisfactionSurvey.create!(
      workspace:    ws,
      ticket:       ticket,
      department:   ticket.department || depts.values.first,
      submitted_by: submitters[idx % submitters.size],
      sentiment_score: sentiment,
      rating:       sentiment > 0.5 ? rand(4..5) : rand(1..3),
      feedback:     sentiment > 0.5 ? 'Issue resolved quickly, great support.' : 'Took too long, communication was poor.',
      created_at:   ticket.created_at + rand(1..48).hours
    )
  end

  Rails.logger.debug { "  Surveys for #{ws.name}: #{TicketSatisfactionSurvey.where(workspace: ws).count}" }
end

Rails.logger.debug { "  LeaveRequests total: #{LeaveRequest.count}" }
Rails.logger.debug { "  OnboardingPlans total: #{OnboardingPlan.count}" }
Rails.logger.debug { "  Surveys total: #{TicketSatisfactionSurvey.count}" }