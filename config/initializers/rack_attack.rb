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

  # Return 429 with Retry-After header
  self.throttled_responder = lambda do |req|
    match_data  = req.env['rack.attack.match_data']
    now         = match_data[:epoch_time]
    retry_after = match_data[:period] - (now % match_data[:period])

    [
      429,
      {
        'Content-Type' => 'application/json',
        'Retry-After'  => retry_after.to_s
      },
      [{ error: 'Too many requests. Please try again later.' }.to_json]
    ]
  end
end
