# frozen_string_literal: true

Rails.logger.debug '  Creating workflow rules and agent actions...'

WORKFLOW_RULES = [
  {
    name:          'Critical tickets auto-escalate to senior agent',
    trigger_event: :ticket_created,
    conditions:    { 'priority' => 'critical', 'status' => 'open' },
    actions:       { 'reassign_to_role' => 'it_manager', 'notify' => true, 'escalate_priority' => true }
  },
  {
    name:          'SLA breach notification to IT manager',
    trigger_event: :sla_breach,
    conditions:    { 'department' => 'IT & Digital Banking' },
    actions:       { 'notify_role' => 'it_manager', 'create_pattern_alert' => true }
  },
  {
    name:          'ATM outage cluster escalation',
    trigger_event: :ticket_created,
    conditions:    { 'category' => 'it', 'tickets_in_cluster' => 5 },
    actions:       { 'notify_role' => 'it_manager', 'escalate_priority' => true, 'create_pattern_alert' => true }
  },
  {
    name:          'Compliance tickets require manager approval',
    trigger_event: :ticket_created,
    conditions:    { 'department' => 'Compliance & Risk' },
    actions:       { 'notify_role' => 'operations_manager', 'require_approval' => true }
  },
  {
    name:          'GDPR requests auto-logged to compliance',
    trigger_event: :ticket_created,
    conditions:    { 'category' => 'hr', 'title_contains' => 'GDPR' },
    actions:       { 'create_compliance_log' => true, 'notify_role' => 'hr_manager' }
  },
  {
    name:          'Vault and security tickets escalate immediately',
    trigger_event: :ticket_created,
    conditions:    { 'category' => 'facilities', 'priority' => 'critical' },
    actions:       { 'notify_role' => 'facilities_manager', 'escalate_priority' => true }
  }
].freeze

Workspace.find_each do |ws|
  WORKFLOW_RULES.each do |data|
    rule = WorkflowRule.create!(
      workspace:        ws,
      name:             data[:name],
      trigger_event:    data[:trigger_event],
      conditions:       data[:conditions],
      actions:          data[:actions],
      active:           true,
      execution_count:  rand(5..25)
    )

    exec_count = 12
    tickets    = Ticket.where(workspace: ws).limit(exec_count)

    tickets.each do |ticket|
      WorkflowExecution.create!(
        workflow_rule: rule,
        ticket:        ticket,
        status: :success,
        executed_at:   rand(1..30).days.ago,
        steps_log: {
          'steps' => [
            { 'action' => 'evaluate_conditions', 'result' => 'matched',    'at' => Time.current.iso8601 },
            { 'action' => 'execute_actions', 'result' => 'completed', 'at' => Time.current.iso8601 }
          ]
        }
      )
    end
  end

  Rails.logger.debug { "  WorkflowRules for #{ws.name}: #{WorkflowRule.where(workspace: ws).count}" }

  # AgentActions — one pending per workspace for human-in-the-loop demo
  critical_ticket = Ticket.where(workspace: ws)
                          .where(priority: Ticket.priorities[:critical])
                          .first

  if critical_ticket
    AgentAction.create!(
      workspace:   ws,
      ticket:      critical_ticket,
      action_type: :auto_resolve,
      status:      :pending_approval,
      confidence:  rand(0.82..0.95).round(2),
      result: {
        'suggested_action' => 'Restart database service and failover to replica',
        'estimated_resolution_time' => '15 minutes',
        'risk_level' => 'medium',
        'steps' => [
          'Identify root cause via logs',
          'Initiate failover to replica DB',
          'Verify service restoration',
          'Notify affected users'
        ]
      }
    )
  end

  Rails.logger.debug { "  AgentActions for #{ws.name}: #{AgentAction.where(workspace: ws).count}" }
end

Rails.logger.debug { "  WorkflowRules total: #{WorkflowRule.count}" }
Rails.logger.debug { "  WorkflowExecutions total: #{WorkflowExecution.count}" }
Rails.logger.debug { "  AgentActions total: #{AgentAction.count}" }