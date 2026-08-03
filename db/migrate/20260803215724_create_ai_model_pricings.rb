# frozen_string_literal: true

class CreateAiModelPricings < ActiveRecord::Migration[8.1]
  def change
    create_table :ai_model_pricings do |t|
      t.string :provider, null: false
      t.string :model, null: false
      t.decimal :input_cost, precision: 10, scale: 6, null: false
      t.decimal :output_cost, precision: 10, scale: 6, null: false
      t.string :source, null: false
      t.datetime :verified_at, null: false

      t.timestamps
    end

    add_index :ai_model_pricings, %i[provider model], unique: true
  end
end