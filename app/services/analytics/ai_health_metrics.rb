# frozen_string_literal: true

module Analytics
  class AiHealthMetrics
    CONFIDENCE_THRESHOLD    = 0.70
    MANUAL_MINUTES_PER_TASK = 15.0
    AI_SECONDS_PER_TASK     = 3.0
    AI_MINUTES_PER_TASK     = AI_SECONDS_PER_TASK / 60.0

    OPERATION_RECOMMENDATIONS = {
      'ticket_classification' => 'Review training prompts and add more few-shot examples for ambiguous categories.',
      'response_suggestion'   => 'Expand RAG knowledge base — low confidence indicates insufficient similar tickets.',
      'asset_risk_scoring'    => 'Asset metadata may be incomplete. ' \
                                 'Ensure serial numbers and warranty dates are populated.',
      'survey_analysis'       => 'Survey responses may be too short. Encourage users to provide detailed feedback.',
      'sla_prediction'        => 'Historical resolution data is sparse. ' \
                                 'Needs 30+ days of ticket history per department.',
      'onboarding_plan'       => 'Role and department context may be missing for new users.',
      'pattern_detection'     => 'Ticket volume too low for reliable pattern detection. Threshold may need adjustment.',
      'executive_report'      => 'Insufficient ticket data for the reporting period.',
      'space_optimization'    => 'Occupancy sensor data may be incomplete or stale.',
      'anomaly_detection'     => 'Baseline period too short — anomaly detection needs 14+ days of history.',
      'ticket_embedding'      => 'Embedding failures indicate tokenization issues. Check ticket description length.'
    }.freeze

    def initialize(workspace:, period_days: 7)
      @workspace = workspace
      @period_days = period_days
      @since = period_days.days.ago.beginning_of_day
    end

    def call
      logs = base_scope

      ServiceResult.success({
                              confidence_distribution:   confidence_distribution(logs),
        operations_below_threshold: operations_below_threshold(logs),
        cost_per_operation:        cost_per_operation(logs),
        estimated_time_saved:      estimated_time_saved(logs),
        top_failing_operations:    top_failing_operations(logs),
        total_operations:          logs.count,
        period_days:               @period_days,
        success_rate:              success_rate(logs)
                            })
    rescue StandardError => e
      Rails.logger.error("Analytics::AiHealthMetrics failed: #{e.message}")
      ServiceResult.failure(error: e.message)
    end

    private

    def base_scope
      @workspace.ai_audit_logs.where(created_at: @since..)
    end

    # Histogram: 4 buckets using a single SQL CASE WHEN pass
    def confidence_distribution(logs)
      rows = logs.where.not(confidence_score: nil)
                 .unscope(:order)
                 .pick(
                   Arel.sql(
                     'COUNT(*) FILTER (WHERE confidence_score < 0.3), ' \
                     'COUNT(*) FILTER (WHERE confidence_score >= 0.3 AND confidence_score < 0.5), ' \
                     'COUNT(*) FILTER (WHERE confidence_score >= 0.5 AND confidence_score < 0.7), ' \
                     'COUNT(*) FILTER (WHERE confidence_score >= 0.7)'
                   )
                 )

      return empty_distribution unless rows

      {
        '0.0-0.3' => rows[0].to_i,
        '0.3-0.5' => rows[1].to_i,
        '0.5-0.7' => rows[2].to_i,
        '0.7-1.0' => rows[3].to_i
      }
    end

    # Operations with avg confidence < threshold — grouped by operation enum value
    def operations_below_threshold(logs)
      logs.where.not(confidence_score: nil)
          .group(:operation)
          .having('AVG(confidence_score) < ?', CONFIDENCE_THRESHOLD)
          .select(:operation, Arel.sql('AVG(confidence_score) AS avg_confidence, COUNT(*) AS total'))
          .map do |row|
            {
              operation:      row.operation,
              avg_confidence: row.avg_confidence.to_f.round(3),
              total:          row.total.to_i,
              recommendation: OPERATION_RECOMMENDATIONS[row.operation] ||
                "Review prompt engineering for #{row.operation.humanize}."
            }
          end
    end

    # Average estimated cost per operation type
    def cost_per_operation(logs)
      logs.group(:operation)
          .select(
            :operation,
            Arel.sql(
              "AVG((prompt_tokens / 1000.0 * #{AiAuditLog::COST_PER_1K_PROMPT_TOKENS}) + " \
              "(completion_tokens / 1000.0 * #{AiAuditLog::COST_PER_1K_COMPLETION_TOKENS})) AS avg_cost, " \
              'COUNT(*) AS total'
            )
          )
          .map do |row|
            {
              operation: row.operation,
              avg_cost:  row.avg_cost.to_f.round(6),
              total:     row.total.to_i
            }
          end
    end

    # Hours saved = (manual_minutes - ai_minutes) * total_ops / 60
    def estimated_time_saved(logs)
      total = logs.count
      minutes_saved = (MANUAL_MINUTES_PER_TASK - AI_MINUTES_PER_TASK) * total
      (minutes_saved / 60.0).round(2)
    end

    # Top 5 operations by error rate in the period
    def top_failing_operations(logs)
      logs.group(:operation)
          .select(
            :operation,
            Arel.sql(
              'COUNT(*) AS total, ' \
              "COUNT(*) FILTER (WHERE status = #{AiAuditLog.statuses[:error]}) AS error_count, " \
              'AVG(confidence_score) AS avg_confidence'
            )
          )
          .having(Arel.sql("COUNT(*) FILTER (WHERE status = #{AiAuditLog.statuses[:error]}) > 0"))
          .order(Arel.sql('error_count DESC'))
          .limit(5)
          .map do |row|
            error_rate = (row.error_count.to_f / row.total * 100).round(1)
            {
              operation:      row.operation,
              total:          row.total.to_i,
              error_count:    row.error_count.to_i,
              error_rate:     error_rate,
              avg_confidence: row.avg_confidence&.to_f&.round(3),
              recommendation: OPERATION_RECOMMENDATIONS[row.operation] ||
                "Investigate error logs for #{row.operation.humanize}."
            }
          end
    end

    def success_rate(logs)
      total = logs.count
      return 0.0 if total.zero?

      successes = logs.where(status: AiAuditLog.statuses[:success]).count
      (successes.to_f / total * 100).round(1)
    end

    def empty_distribution
      { '0.0–0.3' => 0, '0.3–0.5' => 0, '0.5–0.7' => 0, '0.7–1.0' => 0 }
    end
  end
end
