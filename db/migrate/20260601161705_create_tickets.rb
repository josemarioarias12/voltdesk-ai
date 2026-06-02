# frozen_string_literal: true

class CreateTickets < ActiveRecord::Migration[8.1]
  def up
    execute "CREATE SEQUENCE IF NOT EXISTS tickets_global_seq START 1"

    create_table :tickets do |t|
      t.references :workspace,   null: false, foreign_key: true, index: true
      t.references :department,  null: false, foreign_key: true, index: true
      t.references :created_by,  null: false, foreign_key: { to_table: :users }, index: true
      t.references :assigned_to, null: true,  foreign_key: { to_table: :users }, index: true
      t.references :sla_policy,  null: true,  foreign_key: true, index: true

      t.string  :ticket_number, null: false
      t.string  :title,         null: false
      t.text    :description

      t.integer :status,        null: false, default: 0
      t.integer :priority,      null: false, default: 1
      t.integer :category,      null: false, default: 0
      t.integer :source,        null: false, default: 0

      t.integer :urgency_score, null: false, default: 0
      t.jsonb   :ai_metadata,   null: false, default: {}

      t.datetime :due_at
      t.datetime :resolved_at
      t.datetime :first_responded_at

      t.timestamps
    end

    add_index :tickets, %i[workspace_id ticket_number], unique: true,
              name: "index_tickets_on_workspace_id_and_ticket_number"
    add_index :tickets, %i[workspace_id status]
    add_index :tickets, %i[workspace_id priority]
    add_index :tickets, %i[workspace_id assigned_to_id status],
              name: "index_tickets_on_workspace_assignee_status"
    add_index :tickets, %i[workspace_id due_at],
              name: "index_tickets_on_workspace_due_at"
  end

  def down
    drop_table :tickets
    execute "DROP SEQUENCE IF EXISTS tickets_global_seq"
  end
end
