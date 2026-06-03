class CreateLeaveRequests < ActiveRecord::Migration[8.0]
  def change
    create_table :leave_requests do |t|
      t.references :workspace,   null: false, foreign_key: true
      t.references :user,        null: false, foreign_key: true
      t.references :approved_by, foreign_key: { to_table: :users }

      t.integer :leave_type, null: false
      t.date    :start_date, null: false
      t.date    :end_date,   null: false
      t.integer :status,     null: false, default: 0
      t.text    :reason
      t.text    :rejection_reason

      t.timestamps
    end

    add_index :leave_requests, [:workspace_id, :user_id]
    add_index :leave_requests, [:workspace_id, :status]
  end
end
