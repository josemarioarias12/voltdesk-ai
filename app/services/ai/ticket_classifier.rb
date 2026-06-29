# frozen_string_literal: true

module Ai
  class TicketClassifier
    include AiAuditable

    VALID_CATEGORIES = %w[general it hr facilities finance operations support].freeze
    IMAGE_TYPES      = %w[image/jpeg image/png image/gif image/webp].freeze

    SYSTEM_PROMPT = <<~PROMPT
      You are an enterprise support ticket classifier. Analyze the ticket and return ONLY valid JSON.
      No markdown, no explanation, just the JSON object.

      Required JSON schema:
      {
        "category": string,
        "priority": "low" | "medium" | "high" | "critical",
        "urgency_score": integer 0-100,
        "reasoning": {
          "category_signals": [string],
          "priority_signals": [string],
          "confidence": float 0.0-1.0,
          "similar_ticket": string | null
        },
        "tags": [string],
        "suggested_agent": string | null,
        "image_analysis": string | null
      }

      Category MUST be exactly one of: general, it, hr, facilities, finance, operations, support
      - it: hardware, software, network, VPN, laptop, printer, access, passwords
      - hr: leave, vacation, onboarding, payroll, benefits, performance
      - facilities: office, building, AC, cleaning, parking, rooms
      - finance: invoices, expenses, reimbursements, budget
      - operations: processes, workflows, cross-department issues
      - support: customer support, external requests
      - general: anything that does not fit the above

      Priority rules:
      - critical: system down, security breach, data loss, affects many users
      - high: major feature broken, deadline mentioned, significant business impact
      - medium: partial functionality affected, workaround exists
      - low: cosmetic issues, questions, minor inconveniences

      Urgency score 0-100 gives granularity within priority:
      - critical: 80-100, high: 60-79, medium: 30-59, low: 0-29

      If an image is provided, analyze it and populate image_analysis with a specific description
      of visible hardware states, error indicators, or physical problems relevant to the ticket.
    PROMPT

    def self.call(ticket:)
      new(ticket: ticket).call
    end

    def initialize(ticket:)
      @ticket    = ticket
      @workspace = ticket.workspace
    end

    def call
      adapter, model, provider = resolve_adapter
      image_data = fetch_image_data
      prompt     = build_prompt(image_data: image_data)

      with_ai_audit(operation: :ticket_classification, model: model, provider: provider) do |ctx|
        ctx[:prompt] = prompt

        result = adapter.chat(
          prompt:   prompt,
          system:   SYSTEM_PROMPT,
          model:    image_data ? 'gpt-4o' : model,
          messages: build_messages(prompt: prompt, image_data: image_data)
        )

        parsed = parse_response(result[:content])
        ctx[:response]   = result[:content]
        ctx[:tokens]     = result[:tokens]
        ctx[:confidence] = parsed.dig('reasoning', 'confidence')

        category = parsed['category'].to_s.downcase.strip
        category = 'general' unless VALID_CATEGORIES.include?(category)

        @ticket.update!(
          category:     category,
          priority:     parsed['priority'],
          urgency_score: parsed['urgency_score'].to_i,
          ai_metadata:  (@ticket.ai_metadata || {}).merge(build_ai_metadata(parsed, model, provider))
        )

        ServiceResult.success(@ticket)
      end
    rescue StandardError => e
      Rails.logger.error("[TicketClassifier] Failed for ticket #{@ticket.id}: #{e.message}")
      begin
        @ticket.update!(status: :pending_classification)
      rescue StandardError
        nil
      end
      ServiceResult.failure(e.message)
    end

    private

    def resolve_adapter
      router = Ai::ModelRouter.for(workspace: @workspace, operation: :classification)
      router.resolve
    rescue StandardError => e
      Rails.logger.warn("[TicketClassifier] Router failed: #{e.message} — forcing OpenAI fallback")
      adapter = Ai::Providers::OpenaiAdapter.new
      [adapter, 'gpt-4o', 'openai']
    end

    def fetch_image_data
      result = Ai::ImageAnalyzer.call(ticket: @ticket)
      result.success? ? result.data : nil
    end

    def build_prompt(image_data: nil)
      base = <<~PROMPT
        Ticket ##{@ticket.ticket_number}
        Title: #{@ticket.title}
        Description: #{@ticket.description.presence || 'No description provided'}
        Department: #{@ticket.department&.name || 'General'}
        Workspace context: #{@workspace.name}
      PROMPT

      return base unless image_data

      "#{base}\nAn image is attached. Analyze it and populate the image_analysis field.\n"
    end

    def build_messages(prompt:, image_data: nil)
      return nil unless image_data

      [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url:    "data:#{image_data[:content_type]};base64,#{image_data[:base64]}",
              detail: 'low'
            }
          }
        ]
      }]
    end

    def parse_response(content)
      clean = content.gsub(/```json|```/, '').strip
      JSON.parse(clean)
    rescue JSON::ParserError => e
      raise "Invalid JSON from AI provider: #{e.message} — raw: #{content[0..200]}"
    end

    def build_ai_metadata(parsed, model, provider)
      {
        category:        parsed['category'],
        priority:        parsed['priority'],
        urgency_score:   parsed['urgency_score'],
        provider:        provider,
        model:           model,
        reasoning:       parsed['reasoning'],
        tags:            parsed['tags'] || [],
        suggested_agent: parsed['suggested_agent'],
        image_analysis:  parsed['image_analysis']
      }
    end
  end
end
