# frozen_string_literal: true

module Ai
  class TicketClassifier
    include AiAuditable

    # Granular AI categories — stored in ai_metadata only, not in the DB enum
    AI_CATEGORIES = %w[
      hardware_printer hardware_computer hardware_network hardware_phone
      software_installation software_bug software_access software_email
      hr_leave hr_onboarding hr_payroll hr_policy
      facilities_hvac facilities_cleaning facilities_maintenance facilities_space
      finance_reimbursement finance_invoice finance_budget
      security_access security_incident security_compliance
      general
    ].freeze

    # Maps AI granular category -> Ticket.category enum value
    CATEGORY_MAP = {
      'hardware_printer'         => 'it',
      'hardware_computer'        => 'it',
      'hardware_network'         => 'it',
      'hardware_phone'           => 'it',
      'software_installation'    => 'it',
      'software_bug'             => 'it',
      'software_access'          => 'it',
      'software_email'           => 'it',
      'security_access'          => 'it',
      'security_incident'        => 'it',
      'security_compliance'      => 'it',
      'hr_leave'                 => 'hr',
      'hr_onboarding'            => 'hr',
      'hr_payroll'               => 'hr',
      'hr_policy'                => 'hr',
      'facilities_hvac'          => 'facilities',
      'facilities_cleaning'      => 'facilities',
      'facilities_maintenance'   => 'facilities',
      'facilities_space'         => 'facilities',
      'finance_reimbursement'    => 'finance',
      'finance_invoice'          => 'finance',
      'finance_budget'           => 'finance',
      'general'                  => 'general'
    }.freeze

    PRIORITIES = %w[low medium high critical].freeze

    def self.call(ticket:)
      new(ticket: ticket).call
    end

    def initialize(ticket:)
      @ticket    = ticket
      @workspace = ticket.workspace
      @client    = OpenAI::Client.new
    end

    def call
      with_ai_audit(operation: :ticket_classification) do |ctx|
        prompt = build_prompt
        ctx[:prompt] = prompt

        raw_response = @client.chat(
          parameters: {
            model:           'gpt-4o',
            temperature:     0.2,
            max_tokens:      500,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: system_prompt },
              { role: 'user',   content: prompt }
            ]
          }
        )

        content = raw_response.dig('choices', 0, 'message', 'content')
        usage   = raw_response['usage']

        ctx[:response] = content
        ctx[:tokens]   = usage

        parsed = JSON.parse(content)
        validate_schema!(parsed)

        ctx[:confidence] = parsed['confidence']

        ai_category    = parsed['category']
        ticket_category = CATEGORY_MAP.fetch(ai_category, 'general')

        @ticket.update!(
          category:      ticket_category,
          priority:      parsed['priority'],
          urgency_score: parsed['urgency_score'],
          ai_metadata:   build_ai_metadata(parsed, ai_category)
        )

        ServiceResult.success(@ticket)
      end
    rescue JSON::ParserError => e
      Rails.logger.error("[TicketClassifier] JSON parse error for ticket #{@ticket.id}: #{e.message}")
      @ticket.update_columns(status: Ticket.statuses[:pending_classification])
      ServiceResult.failure("AI returned invalid JSON: #{e.message}")
    rescue KeyError => e
      Rails.logger.error("[TicketClassifier] Schema validation failed for ticket #{@ticket.id}: #{e.message}")
      @ticket.update_columns(status: Ticket.statuses[:pending_classification])
      ServiceResult.failure("AI response missing required fields: #{e.message}")
    rescue => e
      Rails.logger.error("[TicketClassifier] Unexpected error for ticket #{@ticket.id}: #{e.message}")
      @ticket.update_columns(status: Ticket.statuses[:pending_classification])
      ServiceResult.failure(e.message)
    end

    private

    def system_prompt
      <<~PROMPT
        You are PulseDesk AI, an enterprise support ticket classifier.
        You MUST respond with a valid JSON object matching this exact schema:
        {
          "category": "<one of the allowed categories>",
          "priority": "<low|medium|high|critical>",
          "urgency_score": <integer 0-100>,
          "confidence": <float 0.0-1.0>,
          "reasoning": {
            "category_signals": ["<word or phrase from the ticket>"],
            "priority_signals": ["<factor that influenced priority>"],
            "similar_ticket": "<TK-NNNNN or null>",
            "explanation": "<one sentence explaining classification>"
          },
          "tags": ["<tag1>", "<tag2>"],
          "suggested_agent_role": "<role name or null>"
        }

        Allowed categories: #{AI_CATEGORIES.join(', ')}

        urgency_score rules:
        - 0-25: low priority, no time pressure
        - 26-50: medium priority, standard resolution window
        - 51-75: high priority, affects multiple users or blocks work
        - 76-100: critical, production down, SLA at risk, affects business continuity

        priority "critical" triggers:
        - words like "down", "not working", "emergency", "urgent", "blocked"
        - time pressure: "in 2 hours", "by EOD", "month close", "deadline"
        - broad impact: "entire team", "all users", "production"
      PROMPT
    end

    def build_prompt
      dept_name = @ticket.department&.name || 'General'
      <<~PROMPT
        Classify this support ticket:

        TICKET ID: #{@ticket.ticket_number}
        DEPARTMENT: #{dept_name}
        TITLE: #{@ticket.title}
        DESCRIPTION: #{@ticket.description.presence || '(no description provided)'}
        CREATED BY ROLE: #{@ticket.created_by&.role || 'employee'}
        WORKSPACE CONTEXT: #{workspace_context}
      PROMPT
    end

    def workspace_context
      dept_names = @workspace.departments.pluck(:name).join(', ')
      "Departments: #{dept_names}. Plan: #{@workspace.plan}."
    end

    def validate_schema!(parsed)
      required_keys = %w[category priority urgency_score confidence reasoning tags]
      missing = required_keys - parsed.keys
      raise KeyError, "Missing keys: #{missing.join(', ')}" if missing.any?

      raise KeyError, "Invalid category: #{parsed['category']}" unless AI_CATEGORIES.include?(parsed['category'])
      raise KeyError, "Invalid priority: #{parsed['priority']}" unless PRIORITIES.include?(parsed['priority'])

      score = parsed['urgency_score'].to_i
      raise KeyError, "urgency_score out of range: #{score}" unless (0..100).cover?(score)

      confidence = parsed['confidence'].to_f
      raise KeyError, "confidence out of range: #{confidence}" unless (0.0..1.0).cover?(confidence)
    end

    def build_ai_metadata(parsed, ai_category)
      {
        category:      ai_category,
        priority:      parsed['priority'],
        urgency_score: parsed['urgency_score'],
        reasoning: {
          category_signals: Array(parsed.dig('reasoning', 'category_signals')),
          priority_signals: Array(parsed.dig('reasoning', 'priority_signals')),
          similar_ticket:   parsed.dig('reasoning', 'similar_ticket'),
          confidence:       parsed['confidence'],
          explanation:      parsed.dig('reasoning', 'explanation')
        },
        tags:            Array(parsed['tags']),
        suggested_agent: parsed['suggested_agent_role'],
        classified_at:   Time.current.iso8601,
        model:           'gpt-4o'
      }
    end
  end
end
