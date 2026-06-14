class CreateSpaces < ActiveRecord::Migration[8.1]
  def change
    create_table :spaces do |t|
      t.references :workspace, null: false, foreign_key: true
      t.string :name, null: false
      t.string :floor, null: false
      t.integer :capacity, null: false, default: 0
      t.jsonb :equipment, null: false, default: {}
      t.integer :status, null: false, default: 0
      t.integer :space_type, null: false, default: 0
      t.timestamps
    end

    add_index :spaces, %i[workspace_id status]
    add_index :spaces, %i[workspace_id floor]
  end
end