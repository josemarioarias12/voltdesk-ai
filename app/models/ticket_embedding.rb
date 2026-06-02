# frozen_string_literal: true

class TicketEmbedding < ApplicationRecord
  has_neighbors :embedding, dimensions: 1536

  belongs_to :ticket
  belongs_to :workspace

  validates :embedding, presence: true
  validates :content, presence: true

  def self.similar_resolved(query_vector:, workspace:, limit: 3, distance_threshold: 0.20)
    resolved_ticket_ids = workspace.tickets.resolved.pluck(:id)
    return none if resolved_ticket_ids.empty?

    where(workspace: workspace, ticket_id: resolved_ticket_ids)
      .nearest_neighbors(:embedding, query_vector, distance: "cosine")
      .limit(limit)
      .select("ticket_embeddings.*, neighbor_distance AS similarity_distance")
      .then { |rel| rel.where("neighbor_distance <= ?", distance_threshold) }
  end
end
