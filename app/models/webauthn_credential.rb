# frozen_string_literal: true

class WebauthnCredential < ApplicationRecord
  include WorkspaceScoped

  belongs_to :workspace
  belongs_to :user

  enum :credential_type, { platform: 0, cross_platform: 1 }, prefix: true

  validates :external_id, presence: true, uniqueness: true
  validates :public_key, presence: true
  validates :sign_count, numericality: { greater_than_or_equal_to: 0 }

  scope :recently_used, -> { order(last_used_at: :desc) }
end
