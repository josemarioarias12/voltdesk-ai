# frozen_string_literal: true

class CreateAiAuditLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :ai_audit_logs do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user, null: true, foreign_key: true

      t.integer :operation, null: false
      t.string :model, null: false, default: "gpt-4o"
      t.text :prompt, null: false
      t.text :response, null: false
      t.integer :prompt_tokens, null: false, default: 0
      t.integer :completion_tokens, null: false, default: 0
      t.integer :total_tokens, null: false, default: 0
      t.integer :duration_ms, null: false, default: 0
      t.decimal :confidence_score, precision: 4, scale: 3
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    add_index :ai_audit_logs, %i[workspace_id created_at], name: "idx_ai_audit_logs_workspace_date"
    add_index :ai_audit_logs, %i[workspace_id operation], name: "idx_ai_audit_logs_workspace_operation"
  end
end
