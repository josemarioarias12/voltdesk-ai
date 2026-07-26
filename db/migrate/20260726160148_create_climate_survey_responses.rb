# frozen_string_literal: true

class CreateClimateSurveyResponses < ActiveRecord::Migration[8.1]
  def change
    create_table :climate_survey_responses do |t|
      t.references :climate_survey, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :rating, null: false
      t.integer :recommend_score, null: false
      t.text :feedback
      t.decimal :sentiment_score, precision: 4, scale: 3

      t.timestamps
    end

    add_index :climate_survey_responses, %i[climate_survey_id user_id], unique: true,
                                                                          name: 'index_climate_responses_on_survey_and_user'
  end
end