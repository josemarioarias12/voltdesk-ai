# frozen_string_literal: true

WebAuthn.configure do |config|
  config.rp_name = 'VoltDesk AI'

  config.allowed_origins = case Rails.env
                           when 'production'
                             ['https://voltdesk.app']
                           when 'development', 'test'
                             ['http://localhost:3000']
                           end

  config.encoding = :base64url
end
