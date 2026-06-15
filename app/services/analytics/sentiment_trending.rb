# frozen_string_literal: true

module Analytics
  class SentimentTrending
    PERIOD_OPTIONS = { '7d' => 7, '30d' => 30, '90d' => 90 }.freeze
    TREND_ALERT_THRESHOLD = -0.15  # Drop of 15+ points triggers alert
    VOLUME_SPIKE_THRESHOLD = 2.0   # 200% increase triggers alert

    def initialize(workspace:, period: '30d', department_id: nil)
      @workspace     = workspace
      @period_days   = PERIOD_OPTIONS.fetch(period, 30)
      @department_id = department_id
      @since         = @period_days.days.ago.beginning_of_day
      @interval      = @period_days <= 7 ? 'day' : 'week'
    end

    def call
      departments = load_departments
      trends      = compute_trends(departments)
      alerts      = detect_alerts(trends)

      ServiceResult.success({
                              trends:       trends,
        alerts:       alerts,
        period_days:  @period_days,
        interval:     @interval,
        departments:  departments.map { |dep| { id: dep.id, name: dep.name, color: dep.color } }
                            })
    rescue StandardError => e
      Rails.logger.error("Analytics::SentimentTrending failed: #{e.message}")
      ServiceResult.failure(error: e.message)
    end

    private

    def load_departments
      scope = @workspace.departments
      scope = scope.where(id: @department_id) if @department_id.present?
      scope
    end

    # Returns array of { department_id, department_name, series: [{period, avg_sentiment, ticket_volume}] }
    def compute_trends(departments)
      dept_ids = departments.pluck(:id)
      return [] if dept_ids.empty?

      sentiment_rows = sentiment_by_period(dept_ids)
      volume_rows    = volume_by_period(dept_ids)

      # Build a unified timeline per department
      departments.filter_map do |dept|
        s_rows = sentiment_rows.select { |row| row.department_id == dept.id }
        v_rows = volume_rows.select { |row| row.department_id == dept.id }

        series = merge_series(s_rows, v_rows)
        next if series.empty?

        {
          department_id:   dept.id,
          department_name: dept.name,
          department_color: dept.color,
          series:          series,
          summary:         compute_summary(series)
        }
      end
    end

    def sentiment_by_period(dept_ids)
      TicketSatisfactionSurvey
        .where(workspace: @workspace, department_id: dept_ids)
        .where(created_at: @since..)
        .group(:department_id, Arel.sql("DATE_TRUNC('#{@interval}', created_at)"))
        .select(
          :department_id,
          Arel.sql(
            "DATE_TRUNC('#{@interval}', created_at) AS period, " \
            'AVG(sentiment_score) AS avg_sentiment, ' \
            'COUNT(*) AS survey_count'
          )
        )
        .order(Arel.sql("DATE_TRUNC('#{@interval}', created_at) ASC"))
    end

    def volume_by_period(dept_ids)
      Ticket
        .where(workspace: @workspace, department_id: dept_ids)
        .where(created_at: @since..)
        .group(:department_id, Arel.sql("DATE_TRUNC('#{@interval}', created_at)"))
        .select(
          :department_id,
          Arel.sql(
            "DATE_TRUNC('#{@interval}', created_at) AS period, " \
            'COUNT(*) AS ticket_volume'
          )
        )
        .order(Arel.sql("DATE_TRUNC('#{@interval}', created_at) ASC"))
    end

    def merge_series(sentiment_rows, volume_rows)
      # Index volume rows by period for O(1) lookup
      volume_index = volume_rows.index_by { |row| row.period.to_s }

      sentiment_rows.map do |row|
        period_key  = row.period.to_s
        vol_row     = volume_index[period_key]

        {
          period:        period_key,
          avg_sentiment: row.avg_sentiment.to_f.round(3),
          survey_count:  row.survey_count.to_i,
          ticket_volume: vol_row&.ticket_volume.to_i
        }
      end
    end

    # Overall summary stats for a department trend
    def compute_summary(series)
      return {} if series.size < 2

      first_sentiment = series.first[:avg_sentiment]
      last_sentiment  = series.last[:avg_sentiment]
      sentiment_delta = (last_sentiment - first_sentiment).round(3)

      first_volume = series.first[:ticket_volume].to_f
      last_volume  = series.last[:ticket_volume].to_f
      volume_ratio = first_volume.zero? ? nil : ((last_volume - first_volume) / first_volume).round(2)

      {
        sentiment_delta:    sentiment_delta,
        volume_ratio:       volume_ratio,
        avg_sentiment:      (series.sum { |s| s[:avg_sentiment] } / series.size).round(3),
        total_ticket_volume: series.sum { |s| s[:ticket_volume] }
      }
    end

    # Detect cross-department alerts: sentiment drop + volume spike
    def detect_alerts(trends)
      trends.filter_map do |trend|
        summary = trend[:summary]
        next if summary.blank?

        alerts = []

        if summary[:sentiment_delta] && summary[:sentiment_delta] <= TREND_ALERT_THRESHOLD
          drop_pct = (summary[:sentiment_delta] * 100).abs.round(1)
          alerts << {
            type:    'sentiment_drop',
            message: "Sentiment in #{trend[:department_name]} dropped #{drop_pct} points " \
                     "over the last #{@period_days} days.",
            severity: summary[:sentiment_delta] <= -0.30 ? 'critical' : 'warning'
          }
        end

        if summary[:volume_ratio] && summary[:volume_ratio] >= VOLUME_SPIKE_THRESHOLD
          pct = (summary[:volume_ratio] * 100).round(0)
          alerts << {
            type:    'volume_spike',
            message: "Ticket volume in #{trend[:department_name]} increased #{pct}% " \
                     "while sentiment #{summary[:sentiment_delta].negative? ? 'declined' : 'held steady'}.",
            severity: 'warning'
          }
        end

        next if alerts.empty?

        {
          department_id:   trend[:department_id],
          department_name: trend[:department_name],
          alerts:          alerts
        }
      end
    end
  end
end
