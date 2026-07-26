# frozen_string_literal: true

class CreateClimateSurveys < ActiveRecord::Migration[8.1]
  def change
    create_table :climate_surveys do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :department, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }, null: false
      t.string :title, null: false
      t.text :description
      t.integer :status, null: false, default: 0
      t.datetime :closes_at
      t.jsonb :ai_themes, null: false, default: []

      t.timestamps
    end

    add_index :climate_surveys, %i[workspace_id status]
  end
end