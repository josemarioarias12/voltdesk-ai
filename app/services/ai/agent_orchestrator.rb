# frozen_string_literal: true

module Ai
  class AgentOrchestrator
    include AiAuditable

    AUTOMATABLE_CATEGORIES = %w[it hr facilities].freeze

    def self.call(ticket:)
      new(ticket:).call
    end

    def initialize(ticket:)
      @ticket              = ticket
      @workspace           = ticket.workspace
      @urgency_threshold   = @workspace.settings.fetch('agent_urgency_threshold', 60).to_f
      @similarity_threshold = @workspace.settings.fetch('agent_similarity_threshold', 0.75).to_f
    end

    def call
      return ServiceResult.failure('Category not automatable') unless automatable?
      return ServiceResult.failure('Urgency below threshold') unless urgency_above_threshold?

      rag_data = build_rag_data
      return ServiceResult.failure('No confident precedent found') unless confident_match?(rag_data)

      if human_in_the_loop?
        create_pending_action(rag_data)
      else
        execute_pipeline(rag_data: rag_data)
      end
    end

    private

    def automatable?
      AUTOMATABLE_CATEGORIES.include?(@ticket.category)
    end

    def urgency_above_threshold?
      @ticket.urgency_score.to_f >= @urgency_threshold
    end

    def confident_match?(rag_data)
      rag_data[:top_similarity].to_f >= @similarity_threshold
    end

    def human_in_the_loop?
      @workspace.settings.fetch('human_in_the_loop', false)
    end

    def create_pending_action(rag_data)
      action = AgentAction.create!(
        workspace:   @workspace,
        ticket:      @ticket,
        action_type: :auto_resolve,
        status:      :pending_approval,
        confidence:  rag_data[:top_similarity],
        result:      {
          pipeline:        'pending_human_approval',
          similar_tickets: rag_data[:similar_tickets],
          top_similarity:  rag_data[:top_similarity],
          ai_reasoning:    rag_data[:ai_reasoning]
        }
      )
      broadcast_pending_approval(action)
      ServiceResult.success(action)
    end

    def execute_pipeline(rag_data:, agent_action: nil)
      steps_log = []
      action    = agent_action || AgentAction.create!(
        workspace:   @workspace,
        ticket:      @ticket,
        action_type: :auto_resolve,
        status:      :executing,
        confidence:  rag_data[:top_similarity],
        result:      {}
      )
      action.update!(status: :executing)
      response_text = run_rag_response(rag_data, steps_log)
      return fail_action(action, steps_log, 'RAG step failed') unless response_text

      run_post_comment(response_text, steps_log)
      run_resolve_ticket(steps_log)
      run_notify_user(steps_log)
      action.update!(
        status:      :completed,
        executed_at: Time.current,
        result:      {
          steps:           steps_log,
          similar_tickets: rag_data[:similar_tickets],
          top_similarity:  rag_data[:top_similarity],
          ai_reasoning:    rag_data[:ai_reasoning]
        }
      )
      ServiceResult.success(action)
    rescue StandardError => e
      action&.update!(status: :failed, result: { error: e.message, steps: steps_log })
      ServiceResult.failure(e.message)
    end

    def build_rag_data
      similar_neighbors = fetch_similar_tickets
      top_similarity    = similar_neighbors.pluck(:similarity).max || 0.0
      prompt = build_rag_prompt(similar_neighbors.pluck(:description))
      adapter, model, provider = Ai::ModelRouter.for(
        workspace: @workspace, operation: :agent_response
      ).resolve
      ai_text = with_ai_audit(
        operation: 'agent_rag_response',
        model:     model,
        provider:  provider
      ) do |ctx|
        ctx[:prompt] = prompt
        raw = adapter.chat(prompt:, system: 'You are a helpdesk AI agent that resolves IT tickets.', model:)
        text = raw.is_a?(Hash) ? raw[:content].to_s : raw.to_s
        ctx[:response]   = text
        ctx[:confidence] = top_similarity
        text
      end
      {
        similar_tickets: similar_neighbors.map do |nbr|
          { id: nbr[:id], title: nbr[:title], similarity: nbr[:similarity] }
        end,
        top_similarity:  top_similarity,
        ai_reasoning:    ai_text.to_s
      }
    rescue StandardError => e
      Rails.logger.error("AgentOrchestrator#build_rag_data failed: #{e.message}")
      { similar_tickets: [], top_similarity: 0.0, ai_reasoning: '' }
    end

    def fetch_similar_tickets
      return [] if @ticket.ticket_embedding.blank?

      TicketEmbedding
        .nearest_neighbors(:embedding, @ticket.ticket_embedding.embedding, distance: 'cosine')
        .where(ticket: @workspace.tickets.where(status: :resolved))
        .limit(3)
        .map do |emb|
          similarity = emb.respond_to?(:neighbor_distance) ? (1.0 - emb.neighbor_distance.to_f).round(4) : 0.0
          {
            id:          emb.ticket.id,
            title:       emb.ticket.title,
            description: emb.ticket.description,
            similarity:  similarity
          }
        end
    end

    def build_rag_prompt(similar_descriptions)
      context = similar_descriptions.join("\n---\n")
      <<~PROMPT
        You are a helpdesk AI agent. Based on similar resolved tickets, generate a resolution response.
        Ticket: #{@ticket.title}
        Description: #{@ticket.description}
        Category: #{@ticket.category}
        Similar resolutions:
        #{context}
        Respond with a concise, actionable resolution message for the user.
      PROMPT
    end

    def run_rag_response(rag_data, steps_log)
      steps_log << { step: 'rag_response', status: 'ok', at: Time.current.iso8601 }
      rag_data[:ai_reasoning].presence
    rescue StandardError => e
      steps_log << { step: 'rag_response', status: 'failed', error: e.message }
      nil
    end

    def run_post_comment(response_text, steps_log)
      @ticket.comments.create!(
        body: response_text,
        user: bot_user
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
        user:              @ticket.created_by,
        workspace:         @workspace,
        title:             'Your ticket has been resolved automatically',
        body:              "Ticket ##{@ticket.id} — #{@ticket.title} was resolved by the AI agent.",
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
          event:      'pending_approval',
          action_id:  action.id,
          ticket_id:  @ticket.id,
          title:      @ticket.title,
          confidence: action.confidence.to_f
        }
      )
    end

    def bot_user
      @bot_user ||= @workspace.users.find_by(email: 'agent@pulsedesk.ai') ||
                    @workspace.users.role_agent.first
    end
  end
end
