# frozen_string_literal: true

class AddUniqueIndexToTicketSatisfactionSurveys < ActiveRecord::Migration[8.0]
  def change
    add_index :ticket_satisfaction_surveys, :ticket_id, unique: true,
              if_not_exists: true
  end
end