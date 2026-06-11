class CreateWorkflowExecutions < ActiveRecord::Migration[8.0]
  def change
    create_table :workflow_executions do |tbl|
      tbl.references :workflow_rule, null: false, foreign_key: true
      tbl.references :ticket,        null: false, foreign_key: true

      tbl.integer  :status,    null: false, default: 0
      tbl.jsonb    :steps_log, null: false, default: {}
      tbl.datetime :executed_at

      tbl.timestamps
    end

    add_index :workflow_executions, :status
    add_index :workflow_executions, :steps_log, using: :gin
    add_index :workflow_executions, :executed_at
  end
end