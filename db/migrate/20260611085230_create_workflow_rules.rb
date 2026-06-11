class CreateWorkflowRules < ActiveRecord::Migration[8.0]
  def change
    create_table :workflow_rules do |tbl|
      tbl.references :workspace, null: false, foreign_key: true

      tbl.string  :name,            null: false
      tbl.integer :trigger_event,   null: false, default: 0
      tbl.jsonb   :conditions,      null: false, default: {}
      tbl.jsonb   :actions,         null: false, default: {}
      tbl.boolean :active,          null: false, default: true
      tbl.integer :execution_count, null: false, default: 0

      tbl.timestamps
    end

    add_index :workflow_rules, :trigger_event
    add_index :workflow_rules, :active
    add_index :workflow_rules, :conditions, using: :gin
    add_index :workflow_rules, :actions,    using: :gin
  end
end