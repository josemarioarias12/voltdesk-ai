# frozen_string_literal: true

class AddMetadataToAiAuditLogs < ActiveRecord::Migration[8.1]
  def change
    add_column :ai_audit_logs, :metadata, :jsonb, default: {}, null: false
  end
end
