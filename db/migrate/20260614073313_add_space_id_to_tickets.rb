class AddSpaceIdToTickets < ActiveRecord::Migration[8.1]
  def change
    add_reference :tickets, :space, null: true, foreign_key: true, index: true
  end
end