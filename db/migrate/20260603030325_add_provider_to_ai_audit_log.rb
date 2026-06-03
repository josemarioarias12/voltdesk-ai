class AddProviderToAiAuditLog < ActiveRecord::Migration[8.1]
  def change
    add_column :ai_audit_logs, :provider, :string
  end
end
