# frozen_string_literal: true

module Analytics
  class ApiMetrics
    def self.call(workspace:, period: 24.hours)
      new(workspace: workspace, period: period).call
    end

    def initialize(workspace:, period:)
      @workspace = workspace
      @period    = period
      @since     = period.ago
    end

    def call
      requests = @workspace.api_requests.where(created_at: @since..)

      ServiceResult.success({
                              requests_per_hour:  requests_per_hour(requests),
        top_endpoints:      top_endpoints(requests),
        error_rate:         error_rate_by_endpoint(requests),
        p95_latency_ms:     p95_latency(requests),
        total_requests:     requests.count,
        total_errors:       requests.where('status_code >= 400').count
                            })
    rescue StandardError => e
      Rails.logger.error("[Analytics::ApiMetrics] #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def requests_per_hour(requests)
      requests
        .group("date_trunc('hour', created_at)")
        .order(Arel.sql("date_trunc('hour', created_at)"))
        .count
        .map { |hour, count| { hour: hour.iso8601, count: count } }
    end

    def top_endpoints(requests)
      requests
        .group(:endpoint, :http_method)
        .order(Arel.sql('COUNT(*) DESC'))
        .limit(5)
        .count
        .map { |(endpoint, method), count| { endpoint: endpoint, method: method, count: count } }
    end

    def error_rate_by_endpoint(requests)
      total_by_endpoint = requests.group(:endpoint).count
      errors_by_endpoint = requests.where('status_code >= 400').group(:endpoint).count

      rows = total_by_endpoint.map do |endpoint, total|
        errors = errors_by_endpoint[endpoint] || 0
        rate   = total.positive? ? (errors.to_f / total * 100).round(1) : 0.0
        { endpoint: endpoint, total: total, errors: errors, error_rate_pct: rate }
      end
      rows.sort_by { |row| -row[:error_rate_pct] }
    end

    def p95_latency(requests)
      requests.pick(
        Arel.sql('PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)')
      ).to_f.round(1)
    end
  end
end
