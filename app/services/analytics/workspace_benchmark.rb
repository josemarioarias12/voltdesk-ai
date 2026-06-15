# frozen_string_literal: true

module Analytics
  class WorkspaceBenchmark
    # Minimum workspaces required to compute a meaningful benchmark
    MIN_WORKSPACES_FOR_BENCHMARK = 3
    PERIOD_DAYS                  = 30

    def initialize(workspace:)
      @workspace = workspace
      @since     = PERIOD_DAYS.days.ago.beginning_of_day
    end

    def call
      all_metrics = compute_all_workspace_metrics

      return ServiceResult.failure(error: 'Not enough data to compute benchmark.') \
        if all_metrics.size < MIN_WORKSPACES_FOR_BENCHMARK

      peer_metrics = all_metrics.select { |wm| wm[:plan] == @workspace.plan }
      peer_metrics = all_metrics if peer_metrics.size < MIN_WORKSPACES_FOR_BENCHMARK

      current = all_metrics.find { |wm| wm[:workspace_id] == @workspace.id }

      return ServiceResult.failure(error: "No activity data for current workspace in last #{PERIOD_DAYS} days.") \
        unless current

      ServiceResult.success({
                              current_workspace: anonymize(current, own: true),
        percentiles:       compute_percentiles(current, all_metrics),
        peer_percentiles:  compute_percentiles(current, peer_metrics),
        peer_count:        peer_metrics.size,
        total_count:       all_metrics.size,
        plan:              @workspace.plan,
        period_days:       PERIOD_DAYS
                            })
    rescue StandardError => e
      Rails.logger.error("Analytics::WorkspaceBenchmark failed: #{e.message}")
      ServiceResult.failure(error: e.message)
    end

    private

    # Aggregate metrics per workspace in a single query pass per metric
    def compute_all_workspace_metrics
      workspace_ids = Workspace.where(active: true).pluck(:id, :plan).to_h

      return [] if workspace_ids.empty?

      ticket_stats   = ticket_metrics_by_workspace
      sla_stats      = sla_metrics_by_workspace
      confidence_stats = confidence_metrics_by_workspace
      cost_stats = cost_metrics_by_workspace

      workspace_ids.filter_map do |wid, plan|
        tickets = ticket_stats[wid]   || {}
        sla     = sla_stats[wid]      || {}
        conf    = confidence_stats[wid] || {}
        cost    = cost_stats[wid] || {}

        next unless tickets[:total].to_i >= 5

        {
          workspace_id:       wid,
          plan:               plan,
          sla_compliance:     sla[:compliance_rate].to_f,
          avg_resolution_hrs: tickets[:avg_resolution_hrs].to_f,
          avg_confidence:     conf[:avg_confidence].to_f,
          cost_per_ticket:    cost[:cost_per_ticket].to_f,
          ticket_volume:      tickets[:total].to_i
        }
      end
    end

    def ticket_metrics_by_workspace
      Ticket.where(created_at: @since..)
            .group(:workspace_id)
            .select(
              :workspace_id,
              Arel.sql(
                'COUNT(*) AS total, ' \
                'AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0) ' \
                'FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_hrs'
              )
            )
            .index_by(&:workspace_id)
            .transform_values { |row| { total: row.total, avg_resolution_hrs: row.avg_resolution_hrs } }
    end

    def sla_metrics_by_workspace
      Ticket.where(created_at: @since..)
            .group(:workspace_id)
            .select(
              :workspace_id,
              Arel.sql(
                'COUNT(*) AS total, ' \
                'COUNT(*) FILTER (WHERE resolved_at IS NOT NULL AND resolved_at <= due_at) AS on_time'
              )
            )
            .index_by(&:workspace_id)
            .transform_values do |row|
              total = row.total.to_f
              rate  = total.zero? ? 0.0 : (row.on_time.to_f / total * 100).round(1)
              { compliance_rate: rate }
            end
    end

    def confidence_metrics_by_workspace
      AiAuditLog.where(created_at: @since..)
                .where.not(confidence_score: nil)
                .group(:workspace_id)
                .select(:workspace_id, Arel.sql('AVG(confidence_score) AS avg_confidence'))
                .index_by(&:workspace_id)
                .transform_values { |row| { avg_confidence: row.avg_confidence } }
    end

    def cost_metrics_by_workspace
      # Total AI cost per workspace from audit logs
      cost_rows = AiAuditLog.where(created_at: @since..)
                            .group(:workspace_id)
                            .select(
                              :workspace_id,
                              Arel.sql(
                                "SUM((prompt_tokens / 1000.0 * #{AiAuditLog::COST_PER_1K_PROMPT_TOKENS}) + " \
                                '(completion_tokens / 1000.0 * ' \
                                "#{AiAuditLog::COST_PER_1K_COMPLETION_TOKENS})) AS total_ai_cost"
                              )
                            )
                            .index_by(&:workspace_id)

      # Ticket count per workspace for cost-per-ticket calculation
      ticket_counts = Ticket.where(created_at: @since..)
                            .group(:workspace_id)
                            .count

      cost_rows.transform_values do |row|
        ticket_count = ticket_counts[row.workspace_id].to_f
        cpt = ticket_count.zero? ? 0.0 : (row.total_ai_cost.to_f / ticket_count).round(6)
        { cost_per_ticket: cpt }
      end
    end

    # Compute percentile rank for current workspace across each metric
    def compute_percentiles(current, pool)
      metrics = %i[sla_compliance avg_resolution_hrs avg_confidence cost_per_ticket]

      metrics.each_with_object({}) do |metric, result|
        values = pool.map { |wm| wm[metric] }.sort
        current_val = current[metric]

        rank = values.count { |val| val <= current_val }
        percentile = pool.size <= 1 ? 50 : ((rank.to_f / pool.size) * 100).round(0).to_i

        # For resolution time and cost, lower is better — invert percentile
        invert = %i[avg_resolution_hrs cost_per_ticket].include?(metric)
        percentile = 100 - percentile if invert

        result[metric] = {
          value:      current_val.round(metric == :avg_confidence ? 3 : 1),
          percentile: percentile
        }
      end
    end

    def anonymize(metrics, own: false)
      result = metrics.except(:workspace_id, :plan)
      result[:is_current] = own
      result
    end
  end
end
