# frozen_string_literal: true

module Ai
  class EmbeddingGenerator
    include AiAuditable

    def self.call(ticket:)
      new(ticket: ticket).call
    end

    def initialize(ticket:)
      @ticket    = ticket
      @workspace = ticket.workspace
    end

    def call
      # Embeddings always route to OpenAI — Gemini (768d) and Anthropic (none)
      # are incompatible with our pgvector 1536-dim HNSW index.
      adapter, model, provider = Ai::ModelRouter.for(
        workspace:  @workspace,
        operation:  :ticket_embedding
      ).resolve

      content = build_content

      with_ai_audit(operation: :ticket_embedding, model: model, provider: provider) do |ctx|
        ctx[:prompt] = content

        result = adapter.embed(text: content)

        ctx[:response] = "[vector #{result[:vector].length}d]"
        ctx[:tokens]   = result[:tokens]

        embedding = TicketEmbedding.find_or_initialize_by(ticket: @ticket)
        embedding.update!(
          workspace: @workspace,
          embedding: result[:vector],
          content:   content
        )

        ServiceResult.success(embedding)
      end
    rescue => e
      Rails.logger.error("[EmbeddingGenerator] Failed for ticket #{@ticket.id}: #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def build_content
      parts = [@ticket.title.to_s.strip]
      parts << @ticket.description.to_s.strip if @ticket.description.present?
      parts << "Department: #{@ticket.department&.name}" if @ticket.department
      parts << "Category: #{@ticket.category}" if @ticket.category.present?
      parts.join("\n\n")
    end
  end
end
