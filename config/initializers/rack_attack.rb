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

  # Return 429 JSON — differentiate API vs web responses
  self.throttled_responder = lambda do |req|
    match_data  = req.env['rack.attack.match_data']
    now         = match_data[:epoch_time]
    retry_after = match_data[:period] - (now % match_data[:period])

    body = if req.path.start_with?('/api/')
             { error: 'Rate limit exceeded', code: 'rate_limited',
                      status: 429, retry_after: retry_after }.to_json
           else
             { error: 'Too many requests. Please try again later.' }.to_json
           end

    [
      429,
      { 'Content-Type' => 'application/json', 'Retry-After' => retry_after.to_s },
      [body]
    ]
  end
end
