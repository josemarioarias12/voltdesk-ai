# frozen_string_literal: true

module Ai
  class PatternDetector
    include AiAuditable

    SIMILARITY_THRESHOLD = 0.3
    CLUSTER_MIN_SIZE     = 5
    WINDOW_HOURS         = 2

    def self.call(workspace:)
      new(workspace: workspace).call
    end

    def initialize(workspace:)
      @workspace = workspace
    end

    def call
      recent = recent_tickets_with_embeddings
      return ServiceResult.success(nil) if recent.size < CLUSTER_MIN_SIZE

      clusters = build_clusters(recent)
      alerts   = clusters.filter_map { |cluster| create_alert_for_cluster(cluster) }
      ServiceResult.success(alerts)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def recent_tickets_with_embeddings
      @workspace.tickets
                .where(created_at: WINDOW_HOURS.hours.ago..)
                .includes(:ticket_embedding)
                .select { |t| t.ticket_embedding.present? }
    end

    def build_clusters(tickets)
      clusters = []
      visited  = Set.new

      tickets.each do |ticket|
        next if visited.include?(ticket.id)

        cluster = [ticket]
        visited.add(ticket.id)
        vec_a = ticket.ticket_embedding.embedding

        tickets.each do |candidate|
          next if visited.include?(candidate.id)

          if cosine_distance(vec_a, candidate.ticket_embedding.embedding) < SIMILARITY_THRESHOLD
            cluster << candidate
            visited.add(candidate.id)
          end
        end

        clusters << cluster if cluster.size >= CLUSTER_MIN_SIZE
      end

      clusters
    end

    def cosine_distance(vec_a, vec_b)
      dot    = vec_a.zip(vec_b).sum { |x, y| x * y }
      norm_a = Math.sqrt(vec_a.sum { |x| x**2 })
      norm_b = Math.sqrt(vec_b.sum { |x| x**2 })
      return 1.0 if norm_a.zero? || norm_b.zero?

      1.0 - (dot / (norm_a * norm_b))
    end

    def create_alert_for_cluster(cluster)
      return nil if duplicate_alert_exists?(cluster)

      ticket_numbers = cluster.map(&:ticket_number)
      alert = @workspace.pattern_alerts.create!(
        alert_type: :ticket_cluster,
        severity: :high,
        title: "#{cluster.size} similar tickets detected in the last #{WINDOW_HOURS}h",
        description: "Possible recurring incident. Tickets: #{ticket_numbers.join(', ')}",
        metadata: {
          ticket_ids:     cluster.map(&:id),
          ticket_numbers: ticket_numbers,
          detected_at:    Time.current.iso8601
        }
      )

      TelegramNotifier.send_prediction(
        message: "Pattern detected: #{cluster.size} similar tickets in #{WINDOW_HOURS}h " \
                 "(#{ticket_numbers.join(', ')}). Possible recurring incident.",
        level: :warning
      )

      broadcast_alert(alert)
      alert
    end

    def duplicate_alert_exists?(cluster)
      ticket_ids = cluster.map(&:id).sort
      @workspace.pattern_alerts
                .alert_type_ticket_cluster
                .where(created_at: 1.hour.ago..)
                .any? do |existing|
                  existing_ids = Array(existing.metadata['ticket_ids']).map(&:to_i).sort
                  (existing_ids & ticket_ids).size >= CLUSTER_MIN_SIZE
                end
    end

    def broadcast_alert(alert)
      ActionCable.server.broadcast(
        "workspace_#{@workspace.id}_managers",
        {
          type:        'pattern_alert',
          alert_id:    alert.id,
          title:       alert.title,
          severity:    alert.severity,
          description: alert.description,
          created_at:  alert.created_at
        }
      )
    end
  end
end
