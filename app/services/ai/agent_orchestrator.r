# frozen_string_literal: true

module Ai
  class AgentOrchestrator
    include AiAuditable

    AUTOMATABLE_CATEGORIES = %w[password_reset access_request equipment_request].freeze

    def self.call(ticket:)
      new(ticket:).call
    end

    def initialize(ticket:)
      @ticket    = ticket
      @workspace = ticket.workspace
      @threshold = @workspace.settings.fetch("agent_threshold", 0.85).to_f
    end

    def call
      return ServiceResult.failure("Category not automatable") unless automatable?
      return ServiceResult.failure("Confidence below threshold") unless above_threshold?

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
      @workspace.settings.fetch("human_in_the_loop", false)
    end

    def create_pending_action
      action = AgentAction.create!(
        workspace:   @workspace,
        ticket:      @ticket,
        action_type: :auto_resolve,
        status:      :pending_approval,
        confidence:  @ticket.urgency_score.to_f,
        result:      { pipeline: "pending_human_approval" }
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
        confidence:  @ticket.urgency_score.to_f,
        result:      {}
      )

      action.update!(status: :executing)

      step_response = run_rag_response(steps_log)
      return fail_action(action, steps_log, "RAG step failed") unless step_response

      run_post_comment(step_response, steps_log)
      run_resolve_ticket(steps_log)
      run_notify_user(steps_log)

      action.update!(
        status:      :completed,
        executed_at: Time.current,
        result:      { steps: steps_log }
      )

      ServiceResult.success(action)
    rescue StandardError => err
      action&.update!(status: :failed, result: { error: err.message, steps: steps_log })
      ServiceResult.failure(err.message)
    end

    def run_rag_response(steps_log)
      similar = TicketEmbedding.nearest_neighbors(
        :embedding, @ticket.embedding_vector, distance: "cosine"
      ).where(ticket: @ticket.workspace.tickets.where(status: :resolved))
       .limit(3)
       .map { |emb| emb.ticket.description }

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

      response = log_ai_call(
        model:      model,
        provider:   provider,
        confidence: @ticket.urgency_score.to_f,
        status:     "success"
      ) do
        adapter.chat(prompt:, max_tokens: 400)
      end

      steps_log << { step: "rag_response", status: "ok", at: Time.current.iso8601 }
      response
    rescue StandardError => err
      steps_log << { step: "rag_response", status: "failed", error: err.message }
      nil
    end

    def run_post_comment(response_text, steps_log)
      @ticket.comments.create!(
        body:   response_text,
        author: bot_user,
        source: "ai_agent"
      )
      steps_log << { step: "post_comment", status: "ok", at: Time.current.iso8601 }
    rescue StandardError => err
      steps_log << { step: "post_comment", status: "failed", error: err.message }
    end

    def run_resolve_ticket(steps_log)
      @ticket.update!(status: :resolved, resolved_at: Time.current)
      steps_log << { step: "resolve_ticket", status: "ok", at: Time.current.iso8601 }
    rescue StandardError => err
      steps_log << { step: "resolve_ticket", status: "failed", error: err.message }
    end

    def run_notify_user(steps_log)
      Notification.create!(
        user:      @ticket.requester,
        workspace: @workspace,
        title:     "Your ticket has been resolved automatically",
        body:      "Ticket ##{@ticket.id} — #{@ticket.title} was resolved by the AI agent.",
        category:  :ticket_update
      )
      steps_log << { step: "notify_user", status: "ok", at: Time.current.iso8601 }
    rescue StandardError => err
      steps_log << { step: "notify_user", status: "failed", error: err.message }
    end

    def fail_action(action, steps_log, reason)
      action.update!(status: :failed, result: { error: reason, steps: steps_log })
      ServiceResult.failure(reason)
    end

    def broadcast_pending_approval(action)
      ActionCable.server.broadcast(
        "agent_actions_#{@workspace.id}",
        {
          event:     "pending_approval",
          action_id: action.id,
          ticket_id: @ticket.id,
          title:     @ticket.title,
          confidence: action.confidence.to_f
        }
      )
    end

    def bot_user
      @bot_user ||= @workspace.users.find_by(email: "agent@pulsedesk.ai") ||
                    @workspace.users.with_role_agent.first
    end
  end
end