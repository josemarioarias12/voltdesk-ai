# frozen_string_literal: true

class Webhook < ApplicationRecord
  SUPPORTED_EVENTS = %w[
    ticket.created
    ticket.resolved
    agent.executed
    sla.breached
  ].freeze

  belongs_to :workspace

  validates :name,          presence: true
  validates :url,           presence: true, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]) }
  validates :secret_digest, presence: true

  scope :active, -> { where(active: true) }
  scope :subscribed_to, ->(event) { active.where('events @> ?', [event].to_json) }

  # Generates a plaintext secret, stores only the SHA256 digest.
  # The plaintext is returned once and never persisted.
  def self.generate_secret
    secret = SecureRandom.hex(32)
    digest = Digest::SHA256.hexdigest(secret)
    [secret, digest]
  end

  # Signs a JSON payload with HMAC-SHA256 using the stored digest as key.
  # Header value: sha256=<hex_signature>
  def sign(payload)
    "sha256=#{OpenSSL::HMAC.hexdigest('SHA256', secret_digest, payload)}"
  end

  def deactivate!
    update!(active: false)
  end
end
