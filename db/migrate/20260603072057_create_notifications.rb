class CreateNotifications < ActiveRecord::Migration[8.0]
  def change
    create_table :notifications do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user,      null: false, foreign_key: true

      t.string  :title,             null: false
      t.text    :body
      t.integer :notification_type, null: false, default: 0
      t.string  :resource_type
      t.bigint  :resource_id
      t.boolean :read,              null: false, default: false

      t.timestamps
    end

    add_index :notifications, [:user_id, :read]
    add_index :notifications, [:workspace_id, :created_at]
    add_index :notifications, [:resource_type, :resource_id]
  end
end
