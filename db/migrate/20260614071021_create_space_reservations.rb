class CreateSpaceReservations < ActiveRecord::Migration[8.1]
  def change
    create_table :space_reservations do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :space, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.datetime :start_at, null: false
      t.datetime :end_at, null: false
      t.integer :attendees_count, null: false, default: 1
      t.integer :status, null: false, default: 0
      t.timestamps
    end

    add_index :space_reservations, %i[space_id start_at end_at]
    add_index :space_reservations, %i[workspace_id status]
    add_index :space_reservations, %i[user_id start_at]
  end
end