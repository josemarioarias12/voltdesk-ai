class CreateDataRetentionPolicies < ActiveRecord::Migration[8.1]
  def change
    create_table :data_retention_policies do |t|
      t.references :workspace, null: false, foreign_key: true
      t.string :resource_type, null: false
      t.integer :retention_days, null: false, default: 365
      t.boolean :auto_purge, null: false, default: false
      t.datetime :last_purge_at
      t.timestamps
    end

    add_index :data_retention_policies, [:workspace_id, :resource_type],
              unique: true,
              name: 'idx_data_retention_policies_workspace_resource'
  end
end