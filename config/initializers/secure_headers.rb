# frozen_string_literal: true

# Secure HTTP headers — applied via ApplicationController before_action.
# No additional gem required; Rails response object provides set_header.
# microphone=(self) exception required for Web Speech API voice feature.
module SecureHeaders
  HEADERS = {
    'X-Frame-Options'        => 'DENY',
    'X-Content-Type-Options' => 'nosniff',
    'X-XSS-Protection'       => '1; mode=block',
    'Referrer-Policy'        => 'strict-origin-when-cross-origin',
    'Permissions-Policy'     => 'camera=(), microphone=(self), geolocation=()'
  }.freeze

  def set_secure_headers
    HEADERS.each { |header, value| response.set_header(header, value) }
  end
end
