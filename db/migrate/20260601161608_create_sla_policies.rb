# frozen_string_literal: true

class CreateSlaPolicies < ActiveRecord::Migration[8.1]
  def change
    create_table :sla_policies do |t|
      t.references :workspace, null: false, foreign_key: true, index: true
      t.string  :name,                   null: false
      t.integer :priority,               null: false, default: 0
      t.integer :first_response_hours,   null: false
      t.integer :resolution_hours,       null: false

      t.timestamps
    end

    add_index :sla_policies, %i[workspace_id priority], unique: true,
              name: "index_sla_policies_on_workspace_id_and_priority"
  end
end
