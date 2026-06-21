# frozen_string_literal: true

module Analytics
  class DashboardMetrics
    MANAGER_ROLES   = %w[department_manager it_manager hr_manager facilities_manager].freeze
    EXECUTIVE_ROLES = %w[operations_manager workspace_admin super_admin].freeze

    def self.call(**args) = new(**args).call

    def initialize(user:, workspace:)
      @user      = user
      @workspace = workspace
    end

    def call
      ServiceResult.success(metrics_for_role)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def metrics_for_role
      return manager_metrics   if MANAGER_ROLES.any? { |r| @user.public_send(:"role_#{r}?") }
      return executive_metrics if EXECUTIVE_ROLES.any? { |r| @user.public_send(:"role_#{r}?") }

      employee_metrics
    end

    def employee_metrics
      my_tickets       = @workspace.tickets.where(created_by: @user)
      my_leave         = @workspace.leave_requests.where(user: @user)
      my_onboarding    = @workspace.onboarding_plans.where(user: @user).first
      my_notifications = @workspace.notifications.where(user: @user).order(created_at: :desc).limit(5)

      {
        role: 'employee',
        tickets: employee_ticket_data(my_tickets),
        leave_requests: employee_leave_data(my_leave),
        onboarding: serialize_onboarding(my_onboarding),
        notifications: serialize_notifications(my_notifications)
      }
    end

    def employee_ticket_data(tickets)
      {
        open: tickets.where(status: %i[open in_progress pending]).count,
        resolved: tickets.where(status: :resolved).count,
        recent: serialize_tickets(tickets.order(created_at: :desc).limit(5))
      }
    end

    def employee_leave_data(leave)
      {
        pending: leave.where(status: :pending).count,
        approved: leave.where(status: :approved).count,
        recent: serialize_leave_requests(leave.order(created_at: :desc).limit(3))
      }
    end

    def manager_metrics
      dept_tickets = scoped_tickets

      {
        role:                'manager',
        kpis:                manager_kpis(dept_tickets),
        ticket_volume_30d:   ticket_volume_30d(dept_tickets),
        tickets_by_category: tickets_by_category(dept_tickets),
        heatmap:             operational_heatmap(dept_tickets),
        agent_performance:   agent_performance(dept_tickets),
        tickets_at_risk:     tickets_at_risk(dept_tickets),
        tickets_breached:    tickets_breached(dept_tickets)
      }
    end

    def manager_kpis(tickets)
      {
        open_tickets: tickets.where(status: %i[open in_progress pending]).count,
        sla_compliance: sla_compliance_percent(tickets),
        avg_resolution_hours: avg_resolution_hours(tickets),
        critical_unassigned: tickets.where(priority: :critical, assigned_to: nil).count
      }
    end

    def executive_metrics
      all_tickets = @workspace.tickets

      {
        role: 'executive',
        kpis: executive_kpis(all_tickets),
        ticket_volume_30d: ticket_volume_30d(all_tickets),
        tickets_by_department: tickets_by_department(all_tickets),
        latest_ai_report: latest_ai_report
      }
    end

    def executive_kpis(tickets)
      {
        total_tickets_week: tickets.where(created_at: 1.week.ago..).count,
        sla_compliance: sla_compliance_percent(tickets),
        avg_resolution_hours: avg_resolution_hours(tickets),
        ai_operations_cost: ai_operations_cost
      }
    end

    def sla_compliance_percent(tickets)
      with_deadline = tickets.where.not(due_at: nil)
      return 100.0 if with_deadline.none?

      breached_open = with_deadline.where(status: %i[open in_progress pending])
                                   .where(due_at: ...Time.current)
                                   .count
      resolved      = with_deadline.where(status: %i[resolved closed])
      late_resolved = resolved.where('resolved_at > due_at').count

      total_with_deadline = with_deadline.count
      non_compliant       = breached_open + late_resolved

      (((total_with_deadline - non_compliant).to_f / total_with_deadline) * 100).round(1)
    end

    def avg_resolution_hours(tickets)
      resolved = tickets.where(status: %i[resolved closed]).where.not(resolved_at: nil)
      return 0.0 if resolved.none?

      total_seconds = resolved.sum('EXTRACT(EPOCH FROM (resolved_at - created_at))')
      (total_seconds / resolved.count / 3600.0).round(1)
    end

    def ticket_volume_30d(tickets)
      29.downto(0).map do |days_ago|
        date = days_ago.days.ago.to_date
        {
          date: date.strftime('%b %d'),
          count: tickets.where(created_at: date.all_day).count
        }
      end
    end

    def tickets_by_category(tickets)
      tickets.group(:category)
             .where.not(category: [nil, ''])
             .count
             .map { |cat, count| { category: cat, count: count } }
             .sort_by { |h| -h[:count] }
             .first(6)
    end

    def tickets_by_department(tickets)
      tickets.joins(:department)
             .group('departments.name')
             .count
             .map { |dept, count| { department: dept, count: count } }
             .sort_by { |h| -h[:count] }
    end

    def operational_heatmap(tickets)
      data = tickets.where(created_at: 7.days.ago..)
                    .group('EXTRACT(DOW FROM created_at)::int',
                           'EXTRACT(HOUR FROM created_at)::int')
                    .count

      (0..6).flat_map do |dow|
        (0..23).map { |hour| { dow: dow, hour: hour, count: data[[dow, hour]] || 0 } }
      end
    end

    def agent_performance(tickets)
      @workspace.users
                .where(role: :agent)
                .map { |agent| agent_stats(agent, tickets) }
                .sort_by { |a| -a[:resolved] }
                .first(10)
    end

    def agent_stats(agent, tickets)
      agent_tickets = tickets.where(assigned_to: agent)
      resolved      = agent_tickets.where(status: %i[resolved closed])
      on_time       = resolved.where('resolved_at <= due_at').count
      sla_pct       = resolved.none? ? 100.0 : ((on_time.to_f / resolved.count) * 100).round(1)

      {
        id: agent.id,
        name: "#{agent.first_name} #{agent.last_name}",
        open: agent_tickets.where(status: %i[open in_progress pending]).count,
        resolved: resolved.count,
        sla_met_pct: sla_pct,
        avg_time_hrs: avg_resolution_hours(agent_tickets)
      }
    end

    def ai_operations_cost
      logs            = @workspace.ai_audit_logs.where(created_at: 1.week.ago..)
      prompt_cost     = logs.sum(:prompt_tokens)     * 0.005 / 1000.0
      completion_cost = logs.sum(:completion_tokens) * 0.015 / 1000.0

      (prompt_cost + completion_cost).round(2)
    end

    def latest_ai_report
      log = @workspace.ai_audit_logs
                      .where(operation: :executive_report)
                      .order(created_at: :desc)
                      .first

      return nil unless log

      { generated_at: log.created_at, content: log.response }
    end

    def scoped_tickets
      return @workspace.tickets unless @user.role_department_manager? && @user.department_id

      @workspace.tickets.where(department_id: @user.department_id)
    end

    def tickets_at_risk(tickets)
      tickets.open_tickets
             .where(sla_breach_probability: 0.70..)
             .where.not(sla_breach_probability: nil)
             .where('due_at > ?', Time.current)
             .order(sla_breach_probability: :desc)
             .limit(20)
             .includes(:assigned_to, :department)
             .map { |tkt| serialize_at_risk_ticket(tkt) }
    end

    def tickets_breached(tickets)
      tickets.sla_breached
             .order(due_at: :asc)
             .limit(20)
             .includes(:assigned_to, :department)
             .map { |tkt| serialize_at_risk_ticket(tkt) }
    end

    def serialize_at_risk_ticket(tkt)
      {
        id:                    tkt.id,
        ticket_number:         tkt.ticket_number,
        title:                 tkt.title,
        priority:              tkt.priority,
        status:                tkt.status,
        due_at:                tkt.due_at,
        sla_breach_probability: tkt.sla_breach_probability&.to_f,
        assigned_to:           tkt.assigned_to ? "#{tkt.assigned_to.first_name} #{tkt.assigned_to.last_name}" : nil,
        department:            tkt.department&.name
      }
    end

    def serialize_tickets(tickets)
      tickets.map do |t|
        { id: t.id, ticket_number: t.ticket_number, title: t.title,
          status: t.status, priority: t.priority, due_at: t.due_at, created_at: t.created_at }
      end
    end

    def serialize_leave_requests(requests)
      requests.map do |lr|
        { id: lr.id, leave_type: lr.leave_type, start_date: lr.start_date,
          end_date: lr.end_date, status: lr.status }
      end
    end

    def serialize_onboarding(plan)
      return nil unless plan

      tasks = plan.onboarding_tasks.order(:order_index)
      {
        id: plan.id,
        completion_percentage: plan.completion_percentage,
        total_tasks: tasks.count,
        completed_tasks: tasks.where(completed: true).count,
        next_tasks: tasks.where(completed: false).limit(3).map do |t|
          { id: t.id, title: t.title, category: t.category }
        end
      }
    end

    def serialize_notifications(notifications)
      notifications.map do |n|
        { id: n.id, title: n.title, body: n.body,
          notification_type: n.notification_type, read: n.read, created_at: n.created_at }
      end
    end
  end
end
