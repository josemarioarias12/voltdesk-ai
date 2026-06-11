# frozen_string_literal: true

class AgentActionsController < ApplicationController
  def index
    actions = policy_scope(AgentAction).includes(:ticket, :workspace)
    authorize AgentAction
    render inertia: 'AgentActions/Index', props: {
      agent_actions: actions.map { |act| serialize(act) }
    }
  end

  def approve
    action = AgentAction.find(params.expect(:id))
    authorize action, :approve?
    result = Ai::AgentOrchestrator.new(ticket: action.ticket).send(:execute_pipeline, agent_action: action)
    action.update!(approved_by: current_user)
    redirect_to agent_actions_path, notice: result.success? ? 'Action executed successfully.' : result.error
  end

  def reject
    action = AgentAction.find(params.expect(:id))
    authorize action, :reject?
    action.update!(status: :rejected, approved_by: current_user)
    redirect_to agent_actions_path, notice: 'Action rejected.'
  end

  private

  def serialize(act)
    {
      id:          act.id,
      ticket_id:   act.ticket_id,
      ticket_title: act.ticket.title,
      action_type: act.action_type,
      status:      act.status,
      confidence:  act.confidence.to_f,
      created_at:  act.created_at.iso8601
    }
  end
end
