# frozen_string_literal: true

class CreateTicketComments < ActiveRecord::Migration[8.1]
  def change
    create_table :ticket_comments do |t|
      t.references :ticket, null: false, foreign_key: true, index: true
      t.references :user,   null: false, foreign_key: true, index: true
      t.text    :body,     null: false
      t.boolean :internal, null: false, default: false

      t.timestamps
    end

    add_index :ticket_comments, %i[ticket_id created_at]
  end
end
