# frozen_string_literal: true

class CreateTicketSatisfactionSurveys < ActiveRecord::Migration[8.0]
  def change
    create_table :ticket_satisfaction_surveys do |tbl|
      tbl.references :workspace,   null: false, foreign_key: true
      tbl.references :ticket,      null: false, foreign_key: true
      tbl.references :department,  null: false, foreign_key: true
      tbl.references :submitted_by, null: false, foreign_key: { to_table: :users }

      tbl.decimal  :sentiment_score, precision: 4, scale: 3, null: false
      tbl.integer  :rating,          null: false
      tbl.text     :feedback
      tbl.string   :ai_themes,       array: true, default: []

      tbl.timestamps
    end

    add_index :ticket_satisfaction_surveys, :sentiment_score
    add_index :ticket_satisfaction_surveys, :created_at
    add_index :ticket_satisfaction_surveys,
              %i[workspace_id department_id created_at],
              name: "idx_surveys_workspace_dept_date"
  end
end