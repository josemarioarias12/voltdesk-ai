class CreateWebhooks < ActiveRecord::Migration[8.0]
  def change
    create_table :webhooks do |tbl|
      tbl.references :workspace,        null: false, foreign_key: true
      tbl.string  :name,                null: false
      tbl.string  :url,                 null: false
      tbl.string  :secret_digest,       null: false
      tbl.jsonb   :events,              null: false, default: []
      tbl.boolean :active,              null: false, default: true
      tbl.datetime :last_triggered_at
      tbl.integer  :failure_count,      null: false, default: 0

      tbl.timestamps
    end

    add_index :webhooks, [:workspace_id, :active]
  end
end