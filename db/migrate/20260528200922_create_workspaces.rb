class CreateWorkspaces < ActiveRecord::Migration[8.1]
  def change
    create_table :workspaces do |t|
      t.string  :name,     null: false
      t.string  :slug,     null: false
      t.string  :plan,     null: false, default: 'starter'
      t.jsonb   :settings, null: false, default: {}
      t.boolean :active,   null: false, default: true

      t.timestamps
    end

    add_index :workspaces, :slug, unique: true
    add_index :workspaces, :active
  end
end