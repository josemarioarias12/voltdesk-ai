# frozen_string_literal: true

module Ai
  class AgentOrchestrator
    include AiAuditable

    AUTOMATABLE_CATEGORIES = %w[it hr facilities].freeze

    def self.call(ticket:)
      new(ticket:).call
    end

    def initialize(ticket:)
      @ticket    = ticket
      @workspace = ticket.workspace
      @threshold = @workspace.settings.fetch('agent_threshold', 0.85).to_f
    end

    def call
      return ServiceResult.failure('Category not automatable') unless automatable?
      return ServiceResult.failure('Confidence below threshold') unless above_threshold?

      if human_in_the_loop?
        create_pending_action
      else
        execute_pipeline
      end
    end

    private

    def automatable?
      AUTOMATABLE_CATEGORIES.include?(@ticket.category)
    end

    def above_threshold?
      @ticket.urgency_score.to_f >= @threshold
    end

    def human_in_the_loop?
      @workspace.settings.fetch('human_in_the_loop', false)
    end

    def create_pending_action
      action = AgentAction.create!(
        workspace:   @workspace,
        ticket:      @ticket,
        action_type: :auto_resolve,
        status:      :pending_approval,
        confidence:  @ticket.urgency_score.to_f / 100.0,
        result:      { pipeline: 'pending_human_approval' }
      )

      broadcast_pending_approval(action)
      ServiceResult.success(action)
    end

    def execute_pipeline(agent_action: nil)
      steps_log = []
      action    = agent_action || AgentAction.create!(
        workspace:   @workspace,
        ticket:      @ticket,
        action_type: :auto_resolve,
        status:      :executing,
        confidence:  @ticket.urgency_score.to_f / 100.0,
        result:      {}
      )

      action.update!(status: :executing)

      step_response = run_rag_response(steps_log)
      return fail_action(action, steps_log, 'RAG step failed') unless step_response

      run_post_comment(step_response, steps_log)
      run_resolve_ticket(steps_log)
      run_notify_user(steps_log)

      action.update!(
        status:      :completed,
        executed_at: Time.current,
        result:      { steps: steps_log }
      )

      ServiceResult.success(action)
    rescue StandardError => e
      action&.update!(status: :failed, result: { error: e.message, steps: steps_log })
      ServiceResult.failure(e.message)
    end

    def run_rag_response(steps_log)
      similar = if @ticket.ticket_embedding.present?
                  TicketEmbedding.nearest_neighbors(
                    :embedding, @ticket.ticket_embedding.embedding, distance: 'cosine'
                  ).where(ticket: @ticket.workspace.tickets.where(status: :resolved))
                                 .limit(3)
                                 .map { |emb| emb.ticket.description }
                else
                  []
                end

      context = similar.join("\n---\n")
      prompt  = <<~PROMPT
        You are a helpdesk AI agent. Based on similar resolved tickets, generate a resolution response.
        Ticket: #{@ticket.title}
        Description: #{@ticket.description}
        Category: #{@ticket.category}
        Similar resolutions:
        #{context}
        Respond with a concise, actionable resolution message for the user.
      PROMPT

      adapter, model, provider = Ai::ModelRouter.for(
        workspace: @workspace, operation: :agent_response
      ).resolve

      response = with_ai_audit(
        operation: 'agent_rag_response',
        model:     model,
        provider:  provider
      ) do |ctx|
        ctx[:prompt] = prompt
        result = adapter.chat(prompt:, system: 'You are a helpdesk AI agent that resolves IT tickets.', model:)
        ctx[:response]   = result.to_s
        ctx[:confidence] = @ticket.urgency_score.to_f
        result
      end

      steps_log << { step: 'rag_response', status: 'ok', at: Time.current.iso8601 }
      response
    rescue StandardError => e
      steps_log << { step: 'rag_response', status: 'failed', error: e.message }
      nil
    end

    def run_post_comment(response_text, steps_log)
      @ticket.comments.create!(
        body:   response_text,
        author: bot_user,
        source: 'ai_agent'
      )
      steps_log << { step: 'post_comment', status: 'ok', at: Time.current.iso8601 }
    rescue StandardError => e
      steps_log << { step: 'post_comment', status: 'failed', error: e.message }
    end

    def run_resolve_ticket(steps_log)
      @ticket.update!(status: :resolved, resolved_at: Time.current)
      steps_log << { step: 'resolve_ticket', status: 'ok', at: Time.current.iso8601 }
    rescue StandardError => e
      steps_log << { step: 'resolve_ticket', status: 'failed', error: e.message }
    end

    def run_notify_user(steps_log)
      Notification.create!(
        user:      @ticket.created_by,
        workspace: @workspace,
        title:     'Your ticket has been resolved automatically',
        body:      "Ticket ##{@ticket.id} — #{@ticket.title} was resolved by the AI agent.",
        notification_type: :ticket_assigned
      )
      steps_log << { step: 'notify_user', status: 'ok', at: Time.current.iso8601 }
    rescue StandardError => e
      steps_log << { step: 'notify_user', status: 'failed', error: e.message }
    end

    def fail_action(action, steps_log, reason)
      action.update!(status: :failed, result: { error: reason, steps: steps_log })
      ServiceResult.failure(reason)
    end

    def broadcast_pending_approval(action)
      ActionCable.server.broadcast(
        "agent_actions_#{@workspace.id}",
        {
          event:     'pending_approval',
          action_id: action.id,
          ticket_id: @ticket.id,
          title:     @ticket.title,
          confidence: action.confidence.to_f
        }
      )
    end

    def bot_user
      @bot_user ||= @workspace.users.find_by(email: 'agent@pulsedesk.ai') ||
                    @workspace.users.with_role_agent.first
    end
  end
end
