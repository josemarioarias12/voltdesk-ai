# frozen_string_literal: true

class CreateAssetIncidents < ActiveRecord::Migration[8.0]
  def change
    create_table :asset_incidents do |t|
      t.references :asset,       null: false, foreign_key: true,                  index: false
      t.references :workspace,   null: false, foreign_key: true,                  index: false
      t.references :reported_by, null: true,  foreign_key: { to_table: :users }

      t.string  :title,       null: false
      t.text    :description
      t.integer :severity,    null: false, default: 0
      t.integer :status,      null: false, default: 0
      t.date    :resolved_at

      t.timestamps
    end

    add_index :asset_incidents, [:asset_id, :created_at]
    add_index :asset_incidents, [:workspace_id, :created_at]
  end
end
