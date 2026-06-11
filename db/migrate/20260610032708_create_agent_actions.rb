class CreateAgentActions < ActiveRecord::Migration[8.0]
  def change
    create_table :agent_actions do |tbl|
      tbl.references :workspace, null: false, foreign_key: true
      tbl.references :ticket,    null: false, foreign_key: true
      tbl.references :approved_by, foreign_key: { to_table: :users }, null: true

      tbl.integer  :action_type, null: false, default: 0
      tbl.integer  :status,      null: false, default: 0
      tbl.decimal  :confidence,  precision: 5, scale: 4, null: false
      tbl.jsonb    :result,      null: false, default: {}
      tbl.datetime :executed_at

      tbl.timestamps
    end

    add_index :agent_actions, :action_type
    add_index :agent_actions, :status
    add_index :agent_actions, :result, using: :gin
  end
end