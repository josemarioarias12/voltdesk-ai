# frozen_string_literal: true

class ApiRequest < ApplicationRecord
  belongs_to :workspace
  belongs_to :api_key

  # Append-only log table — no updates, no deletes.
  # updated_at intentionally omitted from schema.
  validates :endpoint,    presence: true
  validates :http_method, presence: true
end
