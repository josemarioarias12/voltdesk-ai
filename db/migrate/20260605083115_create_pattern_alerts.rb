# frozen_string_literal: true

class CreatePatternAlerts < ActiveRecord::Migration[8.0]
  def change
    create_table :pattern_alerts do |t|
      t.references :workspace, null: false, foreign_key: true
      t.integer    :alert_type,  null: false, default: 0
      t.integer    :severity,    null: false, default: 0
      t.string     :title,       null: false
      t.text       :description
      t.jsonb      :metadata,    null: false, default: {}
      t.datetime   :resolved_at

      t.timestamps
    end

    add_index :pattern_alerts, [:workspace_id, :alert_type]
    add_index :pattern_alerts, :resolved_at
    add_index :pattern_alerts, :metadata, using: :gin
  end
end
