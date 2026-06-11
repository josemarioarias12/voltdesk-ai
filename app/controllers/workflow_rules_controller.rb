# frozen_string_literal: true

class WorkflowRulesController < ApplicationController
  def index
    rules = policy_scope(WorkflowRule).includes(:workspace)
    authorize WorkflowRule
    render inertia: 'WorkflowRules/Index', props: {
      workflow_rules: rules.map { |rule| serialize(rule) }
    }
  end

  def create
    authorize WorkflowRule
    result = Workflows::CreateRule.call(workspace: current_workspace, params: rule_params)
    if result.success?
      redirect_to workflow_rules_path, notice: 'Rule created successfully.'
    else
      redirect_to workflow_rules_path, alert: result.error
    end
  end

  def update
    rule = WorkflowRule.find(params.expect(:id))
    authorize rule
    rule.update!(rule_params)
    redirect_to workflow_rules_path, notice: 'Rule updated.'
  end

  def destroy
    rule = WorkflowRule.find(params.expect(:id))
    authorize rule
    rule.destroy!
    redirect_to workflow_rules_path, notice: 'Rule deleted.'
  end

  private

  def rule_params
    params.expect(workflow_rule: [:name, :trigger_event, :active,
                                  { conditions: {}, actions: {} }])
  end

  def serialize(rule)
    {
      id:              rule.id,
      name:            rule.name,
      trigger_event:   rule.trigger_event,
      conditions:      rule.conditions,
      actions:         rule.actions,
      active:          rule.active,
      execution_count: rule.execution_count,
      created_at:      rule.created_at.iso8601
    }
  end
end
