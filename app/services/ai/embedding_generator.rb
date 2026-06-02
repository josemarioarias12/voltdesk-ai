# frozen_string_literal: true

module Ai
  class EmbeddingGenerator
    include AiAuditable

    EMBEDDING_MODEL = "text-embedding-3-large"

    def self.call(ticket:)
      new(ticket: ticket).call
    end

    def initialize(ticket:)
      @ticket    = ticket
      @workspace = ticket.workspace
      @client    = OpenAI::Client.new
    end

    def call
      content_to_embed = build_content

      with_ai_audit(operation: :ticket_embedding, model: EMBEDDING_MODEL) do |ctx|
        ctx[:prompt] = content_to_embed

        raw_response = @client.embeddings(
          parameters: {
            model: EMBEDDING_MODEL,
            input: content_to_embed
          }
        )

        vector = raw_response.dig("data", 0, "embedding")
        usage  = raw_response["usage"]

        raise "Empty embedding returned by OpenAI" if vector.blank?

        ctx[:response] = "[vector of #{vector.length} dimensions]"
        ctx[:tokens]   = {
          "prompt_tokens"     => usage&.dig("prompt_tokens") || 0,
          "completion_tokens" => 0,
          "total_tokens"      => usage&.dig("total_tokens") || 0
        }

        embedding = TicketEmbedding.find_or_initialize_by(ticket: @ticket)
        embedding.update!(
          workspace: @workspace,
          embedding: vector,
          content:   content_to_embed
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
