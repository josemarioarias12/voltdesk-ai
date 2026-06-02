# frozen_string_literal: true

class CreateTicketActivities < ActiveRecord::Migration[8.1]
  def change
    create_table :ticket_activities do |t|
      t.references :ticket, null: false, foreign_key: true, index: true
      t.references :user,   null: true,  foreign_key: true, index: true
      t.string :action,   null: false
      t.jsonb  :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :ticket_activities, %i[ticket_id created_at]
  end
end
