class CreateDepartments < ActiveRecord::Migration[8.1]
  def change
    create_table :departments do |t|
      t.references :workspace, null: false, foreign_key: true, index: true
      t.string     :name,      null: false
      t.string     :color,     null: false, default: '#6366f1'
      t.string     :icon,      null: false, default: 'briefcase'

      t.timestamps
    end

    add_index :departments, [:workspace_id, :name], unique: true
  end
end