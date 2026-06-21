# frozen_string_literal: true

module Analytics
  class TicketIndexStats
    def self.call(workspace:, scope:)
      new(workspace: workspace, scope: scope).call
    end

    def initialize(workspace:, scope:)
      @workspace = workspace
      @scope     = scope
    end

    def call
      result = {
        total_open:        scope.open_tickets.count,
        in_progress:       scope.where(status: :in_progress).count,
        pending:            scope.where(status: :pending).count,
        sla_breached:       scope.sla_breached.count,
        resolved_today:     resolved_count(Time.current.beginning_of_day..),
        avg_response_hours: average_response_hours(scope),
          by_status:          status_counts,
          delta:              delta
      }
      ServiceResult.success(result)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    attr_reader :workspace, :scope

    def delta
      {
        total_open_today:            scope.where(created_at: Time.current.beginning_of_day..).count,
        in_progress_vs_last_week:    transition_delta('in_progress'),
        sla_breached_critical:       scope.sla_breached.where(priority: :critical).count,
        resolved_today_vs_avg:       resolved_today_vs_avg,
        avg_response_vs_avg_minutes: response_time_delta_minutes
      }
    end

    def status_counts
      Ticket.statuses.keys.index_with { |status| scope.where(status: status).count }
    end

    def resolved_count(range)
      scope.where(status: :resolved).where(resolved_at: range).count
    end

    def transition_delta(status)
      this_week = transitions_to(status, 7.days.ago..Time.current)
      last_week = transitions_to(status, 14.days.ago..7.days.ago)
      this_week - last_week
    end

    def transitions_to(status, range)
      TicketActivity
        .where(ticket_id: scope.select(:id))
        .where(action: TicketActivity::STATUS_CHANGED, created_at: range)
        .where("metadata->>'to' = ?", status)
        .count
    end

    def resolved_today_vs_avg
      avg_last_7_days = resolved_count(7.days.ago.beginning_of_day..Time.current) / 7.0
      (resolved_count(Time.current.beginning_of_day..) - avg_last_7_days).round(1)
    end

    def average_response_hours(relation)
      ticket_ids = relation.pluck(:id)
      return 0.0 if ticket_ids.empty?

      first_responses = TicketComment.where(ticket_id: ticket_ids, internal: false)
                                     .group(:ticket_id)
                                     .minimum(:created_at)
      return 0.0 if first_responses.empty?

      created_ats = Ticket.where(id: first_responses.keys).pluck(:id, :created_at).to_h

      hours = first_responses.filter_map do |ticket_id, first_comment_at|
        created_at = created_ats[ticket_id]
        next unless created_at

        (first_comment_at - created_at) / 3600.0
      end
      return 0.0 if hours.empty?

      (hours.sum / hours.size).round(1)
    end

    def response_time_delta_minutes
      recent = average_response_hours(scope.where(created_at: 7.days.ago..))
      prior  = average_response_hours(scope.where(created_at: 14.days.ago...7.days.ago))
      ((prior - recent) * 60).round
    end
  end
end
