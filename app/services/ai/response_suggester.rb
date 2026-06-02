# frozen_string_literal: true

module Ai
  class ResponseSuggester
    include AiAuditable

    SIMILARITY_THRESHOLD = 0.20
    TOP_K = 3

    def self.call(ticket:, user: nil)
      new(ticket: ticket, user: user).call
    end

    def initialize(ticket:, user: nil)
      @ticket    = ticket
      @workspace = ticket.workspace
      @user      = user
      @client    = OpenAI::Client.new
    end

    def call
      ticket_embedding = TicketEmbedding.find_by(ticket: @ticket)

      if ticket_embedding.nil?
        embed_result = Ai::EmbeddingGenerator.call(ticket: @ticket)
        return ServiceResult.failure("Cannot generate embedding for ticket") if embed_result.failure?
        ticket_embedding = embed_result.data
      end

      similar_embeddings = TicketEmbedding.similar_resolved(
        query_vector:       ticket_embedding.embedding,
        workspace:          @workspace,
        limit:              TOP_K,
        distance_threshold: SIMILARITY_THRESHOLD
      ).includes(ticket: [:ticket_comments])

      if similar_embeddings.empty?
        Rails.logger.info("[ResponseSuggester] No similar resolved tickets for #{@ticket.ticket_number}")
        return ServiceResult.success(nil)
      end

      context_tickets = similar_embeddings.map(&:ticket)
      rag_context     = build_rag_context(context_tickets)
      prompt          = build_rag_prompt(rag_context)
      citation_ids    = context_tickets.map(&:ticket_number)

      with_ai_audit(operation: :response_suggestion) do |ctx|
        ctx[:prompt] = prompt

        raw_response = @client.chat(
          parameters: {
            model:       "gpt-4o",
            temperature: 0.4,
            max_tokens:  600,
            messages: [
              { role: "system", content: system_prompt },
              { role: "user",   content: prompt }
            ]
          }
        )

        suggested_text = raw_response.dig("choices", 0, "message", "content")
        usage          = raw_response["usage"]

        ctx[:response] = suggested_text
        ctx[:tokens]   = usage

        ServiceResult.success({
          suggestion:   suggested_text,
          based_on:     citation_ids,
          generated_at: Time.current.iso8601
        })
      end
    rescue => e
      Rails.logger.error("[ResponseSuggester] Failed for ticket #{@ticket.id}: #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def system_prompt
      <<~PROMPT
        You are PulseDesk AI, a support response assistant.
        You help support agents write professional, empathetic responses to tickets.
        Write a response that:
        - Acknowledges the user's problem
        - Proposes a concrete solution based on the precedents
        - Is professional, concise, and empathetic
        - References specific ticket numbers when you borrow from them (e.g. "as resolved in TK-00043")
        - Does NOT hallucinate solutions not supported by the precedents
        Write in the first person as the support agent, not as "AI".
      PROMPT
    end

    def build_rag_context(tickets)
      tickets.map.with_index(1) do |ticket, idx|
        resolution = extract_resolution(ticket)
        <<~CONTEXT
          PRECEDENT #{idx} — #{ticket.ticket_number} (resolved)
          Title: #{ticket.title}
          Category: #{ticket.category}
          Resolution: #{resolution}
        CONTEXT
      end.join("\n---\n")
    end

    def extract_resolution(ticket)
      last_external = ticket.ticket_comments.where(internal: false).order(:created_at).last
      last_internal = ticket.ticket_comments.order(:created_at).last
      (last_external || last_internal)&.body&.truncate(400) ||
        ticket.description&.truncate(200) ||
        "(no resolution recorded)"
    end

    def build_rag_prompt(rag_context)
      <<~PROMPT
        CURRENT TICKET — #{@ticket.ticket_number}
        Title: #{@ticket.title}
        Description: #{@ticket.description.presence || "(no description)"}
        Department: #{@ticket.department&.name}
        Priority: #{@ticket.priority}

        SIMILAR RESOLVED TICKETS FOR REFERENCE:
        #{rag_context}

        Please write a suggested response for this ticket based on the precedents above.
      PROMPT
    end
  end
end
