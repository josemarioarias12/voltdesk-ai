# frozen_string_literal: true

# rubocop:disable Style/ClassAndModuleChildren
# Rack::Attack is an external gem class — nested module syntax is not applicable here.
class Rack::Attack
  # rubocop:enable Style/ClassAndModuleChildren

  # Throttle login attempts by IP: 10 requests per minute
  throttle('logins/ip', limit: 10, period: 1.minute) do |req|
    req.ip if req.path == '/login' && req.post?
  end

  # Throttle authenticated requests: 60 requests per minute per user
  throttle('requests/user', limit: 60, period: 1.minute) do |req|
    req.env['warden']&.user&.id
  end

  # Throttle AI operations: 20 per minute per workspace
  throttle('ai/workspace', limit: 20, period: 1.minute) do |req|
    req.env['warden']&.user&.workspace_id if req.path.include?('/tickets') && req.post?
  end

  # Throttle API requests by IP: 300 per minute (covers legitimate integrations)
  throttle('api/ip', limit: 300, period: 1.minute) do |req|
    req.ip if req.path.start_with?('/api/')
  end

  # Throttle API requests by API key: 100 per minute per integration
  throttle('api/key', limit: 100, period: 1.minute) do |req|
    if req.path.start_with?('/api/')
      auth = req.get_header('HTTP_AUTHORIZATION') || req.get_header('Authorization')
      auth&.start_with?('Bearer ') ? auth.split(' ', 2).last : nil
    end
  end

  DEMO_EXCLUDED_PATHS = ['/demo/ticket', '/demo/rate_limited'].freeze

  # Throttle demo join by IP: 10 per minute (guest account creation)
  throttle('demo/join/ip', limit: 10, period: 1.minute) do |req|
    req.ip if req.path.start_with?('/demo/') && req.get? && DEMO_EXCLUDED_PATHS.exclude?(req.path)
  end

  # Throttle demo ticket creation by IP: 5 per minute (real AI classification cost per ticket)
  throttle('demo/ticket/ip', limit: 5, period: 1.minute) do |req|
    req.ip if req.path == '/demo/ticket' && req.post?
  end

  # Return 429 JSON for API, Inertia-aware redirect for demo, plain JSON otherwise
  self.throttled_responder = lambda do |req|
    match_data  = req.env['rack.attack.match_data']
    now         = match_data[:epoch_time]
    retry_after = match_data[:period] - (now % match_data[:period])
    headers     = { 'Retry-After' => retry_after.to_s }

    if req.path.start_with?('/api/')
      body = { error: 'Rate limit exceeded', code: 'rate_limited',
               status: 429, retry_after: retry_after }.to_json
      [429, headers.merge('Content-Type' => 'application/json'), [body]]
    elsif req.path.start_with?('/demo/')
      if req.get_header('HTTP_X_INERTIA')
        [409, headers.merge('X-Inertia-Location' => '/demo/rate_limited'), []]
      else
        [302, headers.merge('Location' => '/demo/rate_limited'), []]
      end
    else
      body = { error: 'Too many requests. Please try again later.' }.to_json
      [429, headers.merge('Content-Type' => 'application/json'), [body]]
    end
  end
end
