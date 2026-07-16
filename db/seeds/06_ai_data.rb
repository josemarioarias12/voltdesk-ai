# frozen_string_literal: true

Rails.logger.debug '  Creating AI audit logs and classification corrections...'

AI_OPERATIONS = %w[
  ticket_classification response_suggestion asset_risk_scoring
  pattern_detection sla_prediction survey_analysis executive_report
].freeze

PROVIDER_WEIGHTS = { 'openai' => 0.70, 'anthropic' => 0.25, 'gemini' => 0.05 }.freeze

# Weighted random provider selection
def pick_provider
  roll = rand
  cumulative = 0.0
  PROVIDER_WEIGHTS.each do |provider, weight|
    cumulative += weight
    return provider if roll < cumulative
  end
  'openai'
end

def model_for(provider)
  { 'openai' => 'gpt-4o', 'anthropic' => 'claude-sonnet-4-6', 'gemini' => 'gemini-flash' }[provider]
end

# survey_analysis intentionally reports lower confidence to exercise
# degraded-health alerting on the AI operations dashboard.
def confidence_for(operation)
  operation == 'survey_analysis' ? rand(0.45..0.75).round(2) : rand(0.72..0.98).round(2)
end

Workspace.find_each do |ws|
  admin = User.find_by(workspace: ws, email: "admin@#{ws.slug}.pulsedesk.ai")
  count = 200

  count.times do |idx|
    operation  = AI_OPERATIONS[idx % AI_OPERATIONS.size]
    provider   = pick_provider
    model      = model_for(provider)
    confidence = confidence_for(operation)
    created_at = rand(1..60).days.ago + rand(0..23).hours

    AiAuditLog.create!(
      workspace:        ws,
      user:             admin,
      operation:        operation,
      model:            model,
      provider:         provider,
      prompt:           "Process #{operation} for workspace #{ws.slug} item #{idx}",
      response:         "{\"result\":\"processed\",\"confidence\":#{confidence}}",
      prompt_tokens:    rand(150..600),
      completion_tokens: rand(80..300),
      duration_ms:      rand(400..3500),
      confidence_score: confidence,
      status:           confidence < 0.60 ? :error : :success,
      created_at:       created_at,
      updated_at:       created_at
    )
  end

  Rails.logger.debug { "  AiAuditLog created for #{ws.name}: #{AiAuditLog.where(workspace: ws).count} entries" }

  tickets    = Ticket.where(workspace: ws).limit(60)
  agent      = User.find_by(workspace: ws, email: "agent1@#{ws.slug}.pulsedesk.ai")
  categories = %w[it hr facilities finance operations general]

  tickets.each_with_index do |ticket, idx|
    original  = categories[idx % categories.size]
    corrected = categories[(idx + 1) % categories.size]
    next if original == corrected

    ClassificationCorrection.create!(
      workspace:          ws,
      ticket:             ticket,
      agent:              agent,
      original_category:  original,
      corrected_category: corrected,
      correction_note:    'Reclassified based on ticket content analysis.',
      created_at:         rand(1..30).days.ago
    )
  end

  Rails.logger.debug do
    "  ClassificationCorrections for #{ws.name}: #{ClassificationCorrection.where(workspace: ws).count}"
  end
end

Rails.logger.debug { "  AiAuditLog total: #{AiAuditLog.count}" }
Rails.logger.debug { "  ClassificationCorrections total: #{ClassificationCorrection.count}" }