# frozen_string_literal: true

module Ai
  class AnomalyDetector
    include AiAuditable

    ZSCORE_THRESHOLD    = 2.5
    LOOKBACK_DAYS       = 30
    ANOMALY_WINDOW_MINS = 60
    MIN_TICKETS         = 3

    SEVERITY_BANDS = [
      [6.0, :critical],
      [4.0, :high],
      [2.5, :medium]
    ].freeze

    def self.call(workspace:)
      new(workspace: workspace).call
    end

    def initialize(workspace:)
      @workspace = workspace
      @client    = OpenAI::Client.new
    end

    def call
      alerts_created = []

      departments = @workspace.departments.to_a
      departments.each do |dept|
        result = analyze_department(dept)
        alerts_created << result if result
      end

      ServiceResult.success(alerts_created: alerts_created.compact)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def analyze_department(dept)
      baseline = compute_baseline(dept)
      return nil if baseline[:std_dev] < 0.5

      current_count = tickets_in_window(dept).count
      zscore        = (current_count - baseline[:mean]) / baseline[:std_dev]

      return nil if zscore < ZSCORE_THRESHOLD

      severity     = severity_for(zscore)
      window_ticks = tickets_in_window(dept).includes(:ticket_embedding).to_a
      return nil if window_ticks.size < MIN_TICKETS

      topic_summary = cluster_topic(window_ticks)
      create_alert(dept, zscore, current_count, baseline, severity, topic_summary, window_ticks)
    end

    def compute_baseline(dept)
      counts = daily_counts(dept)
      return { mean: 0.0, std_dev: 0.0 } if counts.empty?

      mean = counts.sum.to_f / counts.size
      variance = counts.sum { |val| (val - mean)**2 } / counts.size.to_f
      std_dev  = Math.sqrt(variance)

      { mean: mean.round(2), std_dev: std_dev.round(2) }
    end

    def daily_counts(dept)
      start_date = LOOKBACK_DAYS.days.ago.to_date
      end_date   = 1.day.ago.to_date

      raw = @workspace.tickets
                      .where(department: dept)
                      .where(created_at: start_date.beginning_of_day..end_date.end_of_day)
                      .group('DATE(created_at)')
                      .count

      (start_date..end_date).map { |date| raw[date] || 0 }
    end

    def tickets_in_window(dept)
      @workspace.tickets
                .where(department: dept)
                .where(created_at: ANOMALY_WINDOW_MINS.minutes.ago..)
    end

    def severity_for(zscore)
      SEVERITY_BANDS.each do |threshold, sev|
        return sev if zscore >= threshold
      end
      :medium
    end

    def cluster_topic(tickets)
      tickets_with_embeddings = tickets.select { |tkt| tkt.ticket_embedding.present? }

      if tickets_with_embeddings.size >= 2
        prompt = build_clustering_prompt(tickets)
        invoke_gpt_for_topic(prompt)
      else
        summarize_titles(tickets)
      end
    end

    def build_clustering_prompt(tickets)
      ticket_list = tickets.first(10).map do |tkt|
        "- #{tkt.ticket_number}: #{tkt.title}"
      end.join("\n")

      <<~PROMPT
        You are an anomaly analysis engine for an enterprise helpdesk.
        The following tickets were all created in the last #{ANOMALY_WINDOW_MINS} minutes,
        which is statistically anomalous (Z-score above #{ZSCORE_THRESHOLD}).

        TICKETS:
        #{ticket_list}

        Identify the single most likely root cause or common theme in ONE sentence (max 20 words).
        Return only the topic sentence, no preamble.
      PROMPT
    end

    def invoke_gpt_for_topic(prompt)
      result = with_ai_audit(operation: :anomaly_topic_summary) do |ctx|
        ctx[:prompt] = prompt

        resp = @client.chat(
          parameters: {
            model:       'gpt-4o',
            messages:    [{ role: 'user', content: prompt }],
            max_tokens:  80,
            temperature: 0.2
          }
        )

        raw = resp.dig('choices', 0, 'message', 'content').to_s.strip
        ctx[:response] = raw
        ctx[:tokens]   = resp['usage'] || {}
        raw
      end

      result.to_s.truncate(200)
    rescue StandardError
      'Anomalous ticket volume detected'
    end

    def summarize_titles(tickets)
      tickets.first(3).map(&:title).join('; ').truncate(200)
    end

    def create_alert(dept, zscore, current_count, baseline, severity, topic_summary, tickets)
      existing = @workspace.pattern_alerts
                           .alert_type_department_surge
                           .where(resolved_at: nil)
                           .where("metadata->>'department_id' = ?", dept.id.to_s)
                           .exists?(created_at: 2.hours.ago..)
      return nil if existing

      PatternAlert.create!(
        workspace:  @workspace,
        alert_type: :department_surge,
        severity:   severity,
        title:      "Anomaly Detected: #{dept.name} (+#{zscore.round(1)}σ)",
        description: topic_summary,
        metadata:   {
          department_id:   dept.id,
          department_name: dept.name,
          zscore:          zscore.round(2),
          current_count:   current_count,
          baseline_mean:   baseline[:mean],
          baseline_std:    baseline[:std_dev],
          ticket_ids:      tickets.map(&:id).first(20),
          alert_source:    'anomaly_detector',
          window_minutes:  ANOMALY_WINDOW_MINS
        }
      )
    end
  end
end
