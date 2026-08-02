# frozen_string_literal: true

class AddAssistantMessageToAiAuditLogs < ActiveRecord::Migration[8.1]
  def change
    add_reference :ai_audit_logs, :assistant_message, null: true, foreign_key: true
  end
end