# frozen_string_literal: true

module Tickets
  class AiPreview
    CATEGORY_SIGNALS = {
      'IT'         => %w[vpn network wifi laptop computer monitor keyboard mouse printer
                         software install driver error crash reboot password login access
                         hardware disk memory ram screen display cable port usb],
      'HR'         => %w[leave vacation payroll salary onboarding offboarding benefits
                         contract hire fired performance review policy training],
      'Facilities' => %w[room meeting space reservation desk chair ac heating light
                         elevator parking cleaning broken door window floor building],
      'Finance'    => %w[invoice payment expense report budget reimbursement purchase
                         vendor contract approval cost billing],
      'Operations' => %w[process workflow delivery shipping logistics supply chain
                         production schedule deadline project milestone]
    }.freeze

    PRIORITY_SIGNALS = {
      'critical' => %w[urgent emergency critical down outage breach production
                       month-close quarter deadline ceo board customer lost data],
      'high'     => %w[asap soon blocked waiting escalate manager important
                       hours today failing multiple users affected],
      'medium'   => %w[slow degraded intermittent sometimes occasional workaround],
      'low'      => %w[minor cosmetic typo suggestion improvement nice feature]
    }.freeze

    MAX_TITLE_LENGTH = 60

    def self.call(title:, description: '')
      new(title: title, description: description).call
    end

    def self.suggest_title(description:)
      new(title: '', description: description).suggest_title
    end

    def initialize(title:, description: '')
      @raw_title       = title.to_s
      @raw_description = description.to_s
      @text            = "#{title} #{description}".downcase
    end

    def call
      category  = detect_category
      priority  = detect_priority
      urgency   = estimate_urgency(category, priority)
      sla_hours = sla_for(priority)

      ServiceResult.success({
                              category:       category,
                              category_conf:  category_confidence(category),
                              priority:       priority,
                              priority_conf:  priority_confidence(priority),
                              urgency_score:  urgency,
                              est_sla_hours:  sla_hours,
                              suggested_title: suggest_title
                            })
    end

    def suggest_title
      return '' if @raw_description.blank?

      clause = first_meaningful_clause(@raw_description)
      title  = clause.presence || @raw_description

      truncate_title(capitalize_sentence(title))
    end

    private

    def first_meaningful_clause(text)
      text.split(/[.!?]|,\s+(?:y|and|but|pero)\s+/i).first.to_s.strip
    end

    def capitalize_sentence(text)
      return '' if text.blank?

      text[0].upcase + text[1..]
    end

    def truncate_title(text)
      return text if text.length <= MAX_TITLE_LENGTH

      "#{text[0...MAX_TITLE_LENGTH].rstrip}..."
    end

    def detect_category
      scores = CATEGORY_SIGNALS.transform_values do |keywords|
        keywords.count { |kw| @text.include?(kw) }
      end
      best = scores.max_by { |_, v| v }
      best[1].positive? ? best[0] : 'IT'
    end

    def category_confidence(category)
      keywords = CATEGORY_SIGNALS[category] || []
      hits = keywords.count { |kw| @text.include?(kw) }
      base = hits.zero? ? 52 : [52 + (hits * 9), 97].min
      base + rand(-2..2)
    end

    def detect_priority
      PRIORITY_SIGNALS.each do |priority, keywords|
        return priority if keywords.any? { |kw| @text.include?(kw) }
      end
      'medium'
    end

    def priority_confidence(priority)
      keywords = PRIORITY_SIGNALS[priority] || []
      hits = keywords.count { |kw| @text.include?(kw) }
      base = hits.zero? ? 55 : [55 + (hits * 8), 96].min
      base + rand(-3..3)
    end

    def estimate_urgency(category, priority)
      base = { 'critical' => 85, 'high' => 65, 'medium' => 40, 'low' => 18 }[priority] || 40
      modifier = category == 'IT' ? 5 : 0
      (base + modifier + rand(-5..5)).clamp(0, 100)
    end

    def sla_for(priority)
      { 'critical' => 1, 'high' => 4, 'medium' => 24, 'low' => 72 }[priority] || 24
    end
  end
end
