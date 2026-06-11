# frozen_string_literal: true

module Workflows
  class EvaluateRules
    SUPPORTED_ACTIONS = %w[
      reassign_agent
      escalate_priority
      notify_user
      notify_manager
      create_agent_action
      post_comment
    ].freeze

    def self.call(ticket:, event:)
      new(ticket:, event:).call
    end

    def initialize(ticket:, event:)
      @ticket    = ticket
      @workspace = ticket.workspace
      @event     = event.to_s
      @results   = []
    end

    def call
      rules = WorkflowRule
              .for_workspace(@workspace.id)
              .active_rules
              .for_event(@event)

      return ServiceResult.success([]) if rules.none?

      rules.each { |rule| evaluate_rule(rule) }

      ServiceResult.success(@results)
    rescue StandardError => e
      Rails.logger.error("[EvaluateRules] #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def evaluate_rule(rule)
      return unless conditions_met?(rule.conditions)

      steps_log = []
      status    = execute_actions(rule.actions, steps_log)

      WorkflowExecution.create!(
        workflow_rule: rule,
        ticket:        @ticket,
        status:        status,
        steps_log:     { steps: steps_log },
        executed_at:   Time.current
      )

      WorkflowRule.where(id: rule.id).update_all('execution_count = execution_count + 1')
      @results << { rule_id: rule.id, rule_name: rule.name, status: status }
    rescue StandardError => e
      Rails.logger.error("[EvaluateRules] Rule #{rule.id} failed: #{e.message}")
    end

    def conditions_met?(conditions)
      conditions.all? do |condition|
        field    = condition['field']
        operator = condition['operator']
        value    = condition['value']
        check_condition(field, operator, value)
      end
    end

    def check_condition(field, operator, value)
      actual = ticket_value(field)
      case operator
      when 'eq'      then actual.to_s == value.to_s
      when 'neq'     then actual.to_s != value.to_s
      when 'gt'      then actual.to_f > value.to_f
      when 'lt'      then actual.to_f < value.to_f
      when 'gte'     then actual.to_f >= value.to_f
      when 'lte'     then actual.to_f <= value.to_f
      when 'contains' then actual.to_s.include?(value.to_s)
      when 'blank'   then actual.blank?
      when 'present' then actual.present?
      else false
      end
    end

    def ticket_value(field)
      case field
      when 'status'        then @ticket.status
      when 'priority'      then @ticket.priority
      when 'category'      then @ticket.category
      when 'urgency_score' then @ticket.urgency_score.to_f
      when 'assigned_to'   then @ticket.assigned_to_id.to_s
      when 'minutes_open'  then ((Time.current - @ticket.created_at) / 60).round
      when 'department_id' then @ticket.department_id.to_s
      end
    end

    def execute_actions(actions, steps_log)
      any_failed = false

      actions.each do |action|
        action_type = action['type']
        next unless SUPPORTED_ACTIONS.include?(action_type)

        begin
          send(:"action_#{action_type}", action)
          steps_log << { action: action_type, status: 'ok', at: Time.current.iso8601 }
        rescue StandardError => e
          steps_log << { action: action_type, status: 'failed', error: e.message }
          any_failed = true
        end
      end

      any_failed ? 'partial' : 'success'
    end

    def action_reassign_agent(action)
      agent = @workspace.users.find_by(id: action['agent_id'])
      @ticket.update!(assigned_to: agent) if agent
    end

    def action_escalate_priority(action)
      new_priority = action['priority'] || 'high'
      @ticket.update!(priority: new_priority)
    end

    def action_notify_user(action)
      Notification.create!(
        user:      @ticket.created_by,
        workspace: @workspace,
        title:     action['title'] || 'Update on your ticket',
        body:      action['body']  || "Your ticket #{@ticket.title} has been updated.",
        notification_type: :ticket_assigned
      )
    end

    def action_notify_manager(action)
      manager = @workspace.users.where(role: %i[workspace_admin hr_manager it_manager]).first
      return unless manager

      Notification.create!(
        user:      manager,
        workspace: @workspace,
        title:     action['title'] || 'Ticket requires attention',
        body:      action['body']  || "Ticket #{@ticket.title} triggered a workflow rule.",
        notification_type: :system_alert
      )
    end

    def action_create_agent_action(action)
      AgentAction.create!(
        workspace:   @workspace,
        ticket:      @ticket,
        action_type: action['action_type'] || 'auto_resolve',
        status:      :pending_approval,
        confidence:  @ticket.urgency_score.to_f,
        result:      { triggered_by: 'workflow_rule' }
      )
    end

    def action_post_comment(action)
      bot = @workspace.users.with_role_agent.first
      return unless bot

      @ticket.comments.create!(
        body:   action['body'] || 'This ticket was automatically updated by a workflow rule.',
        author: bot,
        source: 'workflow'
      )
    end
  end
end
