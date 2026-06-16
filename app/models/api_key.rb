# frozen_string_literal: true

class ApiKey < ApplicationRecord
  belongs_to :workspace
  belongs_to :user

  validates :name,       presence: true
  validates :key_digest, presence: true, uniqueness: true

  scope :active, -> { where(active: true) }

  # Generates a plaintext token, stores only the SHA256 digest.
  # The plaintext is returned once and never persisted.
  def self.generate_token
    token = SecureRandom.hex(32)
    digest = Digest::SHA256.hexdigest(token)
    [token, digest]
  end

  # Looks up an ApiKey by the SHA256 digest of the provided token.
  # Returns nil if not found or inactive.
  def self.authenticate(token)
    return nil if token.blank?

    computed_digest = Digest::SHA256.hexdigest(token)
    candidate = active.find_by(key_digest: computed_digest)
    return nil unless candidate

    ActiveSupport::SecurityUtils.secure_compare(candidate.key_digest, computed_digest) ? candidate : nil
  end

  def revoke!
    update!(active: false)
  end
end
