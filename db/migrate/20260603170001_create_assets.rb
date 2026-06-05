# frozen_string_literal: true

class CreateAssets < ActiveRecord::Migration[8.0]
  def change
    create_table :assets do |t|
      t.references :workspace,   null: false, foreign_key: true, index: false
      t.references :assigned_to, null: true,  foreign_key: { to_table: :users }
      t.references :department,  null: true,  foreign_key: true

      t.string  :name,             null: false
      t.string  :asset_number,     null: false
      t.integer :asset_type,       null: false, default: 0
      t.string  :model_spec
      t.string  :serial_number
      t.integer :status,           null: false, default: 0
      t.integer :risk_score,       null: false, default: 0
      t.integer :incident_count,   null: false, default: 0
      t.date    :purchase_date
      t.decimal :purchase_price,   precision: 10, scale: 2
      t.date    :warranty_expires_at
      t.date    :assigned_at
      t.string  :condition_at_assignment
      t.date    :last_maintenance_at
      t.text    :notes
      t.jsonb   :ai_metadata,          null: false, default: {}
      t.jsonb   :warranty_alerts_sent, null: false, default: {}

      t.timestamps
    end

    add_index :assets, :asset_number
    add_index :assets, [:workspace_id, :status]
    add_index :assets, [:workspace_id, :risk_score]
    add_index :assets, :warranty_expires_at
    add_index :assets, :ai_metadata, using: :gin
  end
end
