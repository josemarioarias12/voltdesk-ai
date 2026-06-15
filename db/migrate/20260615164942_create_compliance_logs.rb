class CreateComplianceLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :compliance_logs do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :actor, null: true, foreign_key: { to_table: :users }
      t.string :resource_type, null: false
      t.bigint :resource_id, null: false
      t.integer :event_type, null: false, default: 0
      t.string :ip_address
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :compliance_logs, :event_type
    add_index :compliance_logs, [:resource_type, :resource_id]
    add_index :compliance_logs, :metadata, using: :gin
    add_index :compliance_logs, :created_at
  end
end