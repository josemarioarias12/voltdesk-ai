# frozen_string_literal: true

class CreateAiModelGovernanceSuggestions < ActiveRecord::Migration[8.1]
  def change
    create_table :ai_model_governance_suggestions do |t|
      t.integer :suggestion_type, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.string :provider, null: false
      t.string :model, null: false
      t.jsonb :result, null: false, default: {}
      t.bigint :reviewed_by_id
      t.datetime :reviewed_at
      t.datetime :applied_at

      t.timestamps
    end

    add_index :ai_model_governance_suggestions, :suggestion_type
    add_index :ai_model_governance_suggestions, :status
    add_index :ai_model_governance_suggestions, %i[provider model]
    add_index :ai_model_governance_suggestions, :result, using: :gin
    add_index :ai_model_governance_suggestions, :reviewed_by_id
    add_foreign_key :ai_model_governance_suggestions, :users, column: :reviewed_by_id
  end
end