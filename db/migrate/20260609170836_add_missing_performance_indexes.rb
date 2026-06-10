# frozen_string_literal: true

class AddMissingPerformanceIndexes < ActiveRecord::Migration[8.0]
  def change
    add_index :tickets, :department_id,
              name: "idx_tickets_department_id",
              if_not_exists: true

    add_index :tickets, :created_at,
              name: "idx_tickets_created_at",
              if_not_exists: true

    add_index :tickets, :assigned_to_id,
              name: "idx_tickets_assigned_to_id",
              if_not_exists: true
  end
end