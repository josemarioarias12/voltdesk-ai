# frozen_string_literal: true

module Ai
  class SlaRiskScorer
    include AiAuditable

    MODEL = 'gpt-4o-mini'

    TIME_PRESSURE_WEIGHT = 0.50
    URGENCY_WEIGHT        = 0.30
    AGENT_LOAD_WEIGHT     = 0.20

    WATCH_THRESHOLD    = 0.50
    AT_RISK_THRESHOLD  = 0.70
    CRITICAL_THRESHOLD = 0.85

    CRITICAL_RENOTIFY_COOLDOWN = 30.minutes
    AGENT_LOAD_CAP = 10

    def self.call(ticket:)
      new(ticket: ticket).call
    end

    def initialize(ticket:)
      @ticket    = ticket
      @workspace = ticket.workspace
      @adapter   = Ai::Providers::OpenaiAdapter.new
    end

    def call
      return ServiceResult.success(skipped: :no_due_at) if @ticket.due_at.nil?
      return ServiceResult.success(skipped: :already_breached) if @ticket.sla_breached?

      probability    = calculate_probability
      previous_level = @ticket.sla_risk_level.to_sym
      new_level      = level_for(probability)

      persist_score(probability, previous_level, new_level)
      notify_if_needed(previous_level: previous_level, new_level: new_level, probability: probability)

      ServiceResult.success(probability: probability, level: new_level, ticket_id: @ticket.id)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    # ── Deterministic scoring — the number never comes from AI ────────────────

    def calculate_probability
      score = (time_pressure * TIME_PRESSURE_WEIGHT) +
              (urgency_factor * URGENCY_WEIGHT) +
              (agent_load_factor * AGENT_LOAD_WEIGHT)
      score.clamp(0.0, 1.0)
    end

    def time_pressure
      hours_remaining = [(@ticket.due_at - Time.current) / 3600.0, 0.0].max
      policy_hours    = @ticket.sla_policy&.resolution_hours || 24
      (1 - (hours_remaining / policy_hours)).clamp(0.0, 1.0)
    end

    def urgency_factor
      (@ticket.urgency_score / 100.0).clamp(0.0, 1.0)
    end

    def agent_load_factor
      agent = @ticket.assigned_to
      return 0.0 unless agent

      open_count = Ticket.where(workspace: @workspace, assigned_to: agent).open_tickets.count
      (open_count.to_f / AGENT_LOAD_CAP).clamp(0.0, 1.0)
    end

    def level_for(probability)
      return :critical if probability >= CRITICAL_THRESHOLD
      return :at_risk  if probability >= AT_RISK_THRESHOLD
      return :watch    if probability >= WATCH_THRESHOLD

      :none
    end

    def persist_score(probability, previous_level, new_level)
      attrs = { sla_breach_probability: probability, sla_predicted_at: Time.current }

      if new_level != previous_level
        attrs[:sla_risk_level] = Ticket.sla_risk_levels[new_level.to_s]
        attrs[:sla_risk_level_changed_at] = Time.current
      end

      # rubocop:disable Rails/SkipsModelValidations
      @ticket.update_columns(attrs)
      # rubocop:enable Rails/SkipsModelValidations
    end

    # ── Notification decision — hysteresis, not "alert every run" ─────────────

    def notify_if_needed(previous_level:, new_level:, probability:)
      return unless should_notify?(previous_level: previous_level, new_level: new_level)

      reasoning = generate_reasoning(probability: probability)
      TelegramNotifier.send_prediction(
        message: build_message(probability: probability, reasoning: reasoning),
        level: new_level == :critical ? :critical : :warning,
        link: ticket_link,
        link_label: 'View ticket'
      )
      Ai::SlaNotifier.call(ticket: @ticket, probability: probability, reasoning: reasoning)
    end

    def should_notify?(previous_level:, new_level:)
      return false if %i[none watch].include?(new_level)

      level_increased = risk_rank(new_level) > risk_rank(previous_level)
      return true if level_increased

      new_level == :critical && cooldown_elapsed?
    end

    def risk_rank(level)
      Ticket.sla_risk_levels.fetch(level.to_s)
    end

    def cooldown_elapsed?
      changed_at = @ticket.sla_risk_level_changed_at
      changed_at.nil? || changed_at <= CRITICAL_RENOTIFY_COOLDOWN.ago
    end

    def generate_reasoning(probability:)
      prompt = build_reasoning_prompt(probability: probability)

      with_ai_audit(operation: :sla_prediction, model: MODEL, provider: 'openai') do |ctx|
        ctx[:prompt] = prompt

        result = @adapter.chat(
          prompt: prompt,
          system: 'You explain SLA risk scores in one short, plain-language sentence ' \
                  'for a non-technical manager. No JSON, no markdown, just the sentence.',
          model: MODEL
        )

        ctx[:response] = result[:content]
        ctx[:tokens]   = result[:tokens]
        result[:content].to_s.strip.truncate(200)
      end
    rescue StandardError
      default_reasoning
    end

    def default_reasoning
      "Ticket #{@ticket.ticket_number} is approaching its SLA deadline given current workload and urgency."
    end

    def build_reasoning_prompt(probability:)
      agent_name      = @ticket.assigned_to&.full_name || 'Unassigned'
      hours_remaining = [(@ticket.due_at - Time.current) / 3600.0, 0.0].max

      <<~PROMPT
        A ticket has an SLA breach risk score of #{(probability * 100).round}%, calculated from
        time remaining (#{hours_remaining.round(1)}h), urgency score (#{@ticket.urgency_score}/100),
        and agent #{agent_name}'s current workload.

        Write ONE short sentence (max 25 words) explaining the main driver of this risk,
        in plain business language for a non-technical manager. No JSON, no preamble.
      PROMPT
    end

    def build_message(probability:, reasoning:)
      pct             = (probability * 100).round
      hours_remaining = [(@ticket.due_at - Time.current) / 3600.0, 0.0].max
      agent_name      = @ticket.assigned_to&.full_name || 'Unassigned'

      "#{@ticket.ticket_number} · #{@ticket.department&.name} — #{pct}% SLA breach risk, " \
        "~#{format_remaining(hours_remaining)} remaining\n" \
        "Assigned: #{agent_name}\n" \
        "#{reasoning}"
    end

    def format_remaining(hours)
      return "#{(hours * 60).round}min" if hours < 1

      "#{hours.round(1)}h"
    end

    def ticket_link
      host = ENV.fetch('APP_HOST', 'voltdesk.app')
      "https://#{host}/tickets/#{@ticket.id}"
    end
  end
end
