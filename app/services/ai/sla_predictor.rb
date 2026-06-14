# frozen_string_literal: true

module Ai
  class SlaPredictor
    include AiAuditable

    BREACH_THRESHOLD = 0.70
    SCHEMA = {
      type: 'object',
      properties: {
        probability: { type: 'number', minimum: 0.0, maximum: 1.0 },
        contributing_factors: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 5
        },
        reasoning: { type: 'string' }
      },
      required: %w[probability contributing_factors reasoning],
      additionalProperties: false
    }.freeze

    def self.call(ticket:)
      new(ticket: ticket).call
    end

    def initialize(ticket:)
      @ticket    = ticket
      @workspace = ticket.workspace
      @client    = OpenAI::Client.new
    end

    def call
      factors  = gather_factors
      response = invoke_gpt(factors)
      return ServiceResult.failure('GPT returned nil') if response.nil?

      parsed = parse_response(response)
      persist_prediction(parsed[:probability])

      ServiceResult.success(
        probability:         parsed[:probability],
        contributing_factors: parsed[:contributing_factors],
        reasoning:           parsed[:reasoning],
        ticket_id:           @ticket.id,
        at_risk:             parsed[:probability] >= BREACH_THRESHOLD
      )
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def gather_factors
      {
        urgency_score:              @ticket.urgency_score,
        hours_until_due:            hours_until_due,
        agent_avg_resolution_hours: agent_avg_resolution_hours,
        department_current_load:    department_current_load,
        hour_of_day:                Time.current.hour,
        day_of_week:                Time.current.strftime('%A'),
        priority:                   @ticket.priority,
        ticket_age_hours:           ticket_age_hours,
        sla_policy_hours:           sla_policy_hours
      }
    end

    def invoke_gpt(factors)
      prompt = build_prompt(factors)

      with_ai_audit(operation: :sla_prediction) do |ctx|
        ctx[:prompt] = prompt

        resp = @client.chat(
          parameters: {
            model:           'gpt-4o',
            messages:        [{ role: 'user', content: prompt }],
            max_tokens:      400,
            temperature:     0.1,
            response_format: { type: 'json_object' }
          }
        )

        raw = resp.dig('choices', 0, 'message', 'content').to_s
        ctx[:response] = raw
        ctx[:tokens]   = resp['usage'] || {}
        raw
      end
    end

    def build_prompt(factors)
      agent_name = @ticket.assigned_to&.full_name || 'Unassigned'

      <<~PROMPT
        You are a SLA breach prediction engine for an enterprise helpdesk system.
        Analyze the following ticket factors and predict the probability of SLA breach.

        TICKET CONTEXT:
        - Ticket: #{@ticket.ticket_number} | Priority: #{factors[:priority]}
        - Urgency score (0-100): #{factors[:urgency_score]}
        - Hours until SLA deadline: #{factors[:hours_until_due].round(1)}
        - Ticket age: #{factors[:ticket_age_hours].round(1)} hours
        - SLA policy total hours: #{factors[:sla_policy_hours]}

        AGENT CONTEXT (#{agent_name}):
        - Agent average resolution time: #{factors[:agent_avg_resolution_hours].round(1)} hours

        ENVIRONMENTAL CONTEXT:
        - Department current open tickets: #{factors[:department_current_load]}
        - Hour of day (0-23): #{factors[:hour_of_day]}
        - Day of week: #{factors[:day_of_week]}

        INSTRUCTIONS:
        Return a JSON object with exactly these fields:
        - probability: float between 0.0 and 1.0 representing breach probability
        - contributing_factors: array of 2-5 strings naming the top risk factors
        - reasoning: one sentence explaining the primary driver

        High urgency_score + low hours_until_due + high agent load = high breach probability.
        If hours_until_due <= 0, probability should be >= 0.95.
      PROMPT
    end

    def parse_response(raw)
      data = JSON.parse(raw)
      {
        probability:          data['probability'].to_f.clamp(0.0, 1.0),
        contributing_factors: Array(data['contributing_factors']).first(5),
        reasoning:            data['reasoning'].to_s.truncate(300)
      }
    rescue JSON::ParserError
      { probability: 0.5, contributing_factors: ['parse_error'], reasoning: 'Could not parse AI response' }
    end

    def persist_prediction(probability)
      # rubocop:disable Rails/SkipsModelValidations
      @ticket.update_columns(
        sla_breach_probability: probability,
        sla_predicted_at:       Time.current
      )
      # rubocop:enable Rails/SkipsModelValidations
    end

    # ── Factor calculators ───────────────────────────────────────────────────

    def hours_until_due
      return 0.0 unless @ticket.due_at

      [(@ticket.due_at - Time.current) / 3600.0, 0.0].max
    end

    def ticket_age_hours
      (Time.current - @ticket.created_at) / 3600.0
    end

    def sla_policy_hours
      @ticket.sla_policy&.resolution_hours || 24
    end

    def agent_avg_resolution_hours
      agent = @ticket.assigned_to
      return 24.0 unless agent

      resolved = Ticket.where(
        workspace:   @workspace,
        assigned_to: agent,
        status:      :resolved
      ).where.not(resolved_at: nil).where(created_at: 90.days.ago..)

      return 24.0 if resolved.empty?

      avg_seconds = resolved.average(
        Arel.sql('EXTRACT(EPOCH FROM (resolved_at - created_at))')
      ).to_f
      (avg_seconds / 3600.0).round(2)
    end

    def department_current_load
      Ticket.where(
        workspace:  @workspace,
        department: @ticket.department
      ).open_tickets.count
    end
  end
end
