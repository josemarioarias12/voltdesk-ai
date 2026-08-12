# frozen_string_literal: true

class TicketEmbedding < ApplicationRecord
  has_neighbors :embedding, dimensions: 1536

  belongs_to :ticket
  belongs_to :workspace

  validates :embedding, presence: true
  validates :content, presence: true

  CANDIDATE_POOL_SIZE = 20

  def self.similar_resolved(query_vector:, workspace:, limit: 3, distance_threshold: 0.20)
    resolved_ticket_ids = workspace.tickets.status_resolved.pluck(:id)
    return none if resolved_ticket_ids.empty?

    # neighbor_distance is a computed SELECT alias, not filterable in SQL WHERE.
    candidates = where(workspace: workspace, ticket_id: resolved_ticket_ids)
                 .nearest_neighbors(:embedding, query_vector, distance: 'cosine')
                 .limit(CANDIDATE_POOL_SIZE)

    matching_ids = candidates.select { |c| c.neighbor_distance <= distance_threshold }
                             .first(limit)
                             .map(&:id)

    return none if matching_ids.empty?

    order_sql = sanitize_sql_array(['array_position(ARRAY[?]::bigint[], ticket_embeddings.id)', matching_ids])
    where(id: matching_ids).order(Arel.sql(order_sql))
  end
end
