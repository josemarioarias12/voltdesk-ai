# frozen_string_literal: true

Rails.logger.debug '  Creating API keys, webhooks, and API requests...'

WEBHOOK_EVENTS = %w[
  ticket.created ticket.updated ticket.resolved sla.breached
  pattern.detected compliance.event gdpr.request
].freeze

ENDPOINTS = %w[
  /api/v1/tickets
  /api/v1/tickets/:id
  /api/v1/tickets/:id/comments
  /api/v1/users
  /api/v1/assets
  /api/v1/workspaces/stats
].freeze

Workspace.find_each do |ws|
  admin = User.find_by(workspace: ws, email: "admin@#{ws.slug}.pulsedesk.ai")

  # ApiKey — one active per workspace
  raw_token = SecureRandom.hex(32)
  ApiKey.create!(
    workspace:    ws,
    user:         admin,
    name:         "#{ws.name} Primary Integration Key",
    key_digest:   Digest::SHA256.hexdigest(raw_token),
    active:       true,
    last_used_at: rand(1..7).days.ago,
    scopes:       { 'read' => %w[tickets users assets], 'write' => ['tickets'] }
  )

  # Webhook
  Webhook.create!(
    workspace:        ws,
    name:             "#{ws.name} Main Webhook",
    url:              "https://hooks.#{ws.slug}.example.com/pulsedesk",
    secret_digest:    Digest::SHA256.hexdigest(SecureRandom.hex(16)),
    events:           WEBHOOK_EVENTS,
    active:           true,
    last_triggered_at: rand(1..3).days.ago,
    failure_count:    rand(0..2)
  )

  # ApiRequests
  api_key      = ApiKey.find_by(workspace: ws)
  req_count    = 500
  status_codes = [200, 200, 200, 200, 201, 422, 404, 500]

  req_count.times do |idx|
    created_at  = rand(1..30).days.ago + rand(0..23).hours
    status_code = status_codes[idx % status_codes.size]

    ApiRequest.create!(
      workspace:   ws,
      api_key:     api_key,
      endpoint:    ENDPOINTS[idx % ENDPOINTS.size],
      http_method: (idx % 5).zero? ? 'POST' : 'GET',
      status_code: status_code,
      duration_ms: rand(20..800),
      ip_address:  "203.0.113.#{rand(1..254)}",
      created_at:  created_at
    )
  end

  key_count       = ApiKey.where(workspace: ws).count
  hook_count      = Webhook.where(workspace: ws).count
  request_count   = ApiRequest.where(workspace: ws).count
  Rails.logger.debug { "  ApiKeys: #{key_count} | Webhooks: #{hook_count} | ApiRequests: #{request_count} — #{ws.name}" }
end

Rails.logger.debug { "  ApiKeys total: #{ApiKey.count}" }
Rails.logger.debug { "  Webhooks total: #{Webhook.count}" }
Rails.logger.debug { "  ApiRequests total: #{ApiRequest.count}" }