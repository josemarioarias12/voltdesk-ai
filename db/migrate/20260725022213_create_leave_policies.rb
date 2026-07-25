# frozen_string_literal: true

class CreateLeavePolicies < ActiveRecord::Migration[8.1]
  def change
    create_table :leave_policies do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :department, foreign_key: true
      t.integer :leave_type
      t.integer :max_concurrent
      t.integer :min_notice_days
      t.boolean :requires_second_approval, null: false, default: false
      t.integer :second_approval_threshold_days
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    # NULL != NULL in Postgres, so a plain unique index would allow duplicate
    # default policies (department_id/leave_type both nil). Sentinel values close that gap.
    execute <<~SQL.squish
      CREATE UNIQUE INDEX index_leave_policies_on_scope
      ON leave_policies (workspace_id, COALESCE(department_id, 0), COALESCE(leave_type, -1))
    SQL
  end
end