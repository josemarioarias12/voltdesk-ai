# frozen_string_literal: true

FactoryBot.define do
  factory :webauthn_credential do
    association :user
    workspace     { user.workspace }
    external_id   { SecureRandom.base64(32) }
    public_key    { SecureRandom.base64(64) }
    sign_count    { 0 }
    credential_type { :platform }
    nickname { 'Test Passkey' }
  end
end
