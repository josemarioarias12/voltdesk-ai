class CreateOnboardingPlans < ActiveRecord::Migration[8.0]
  def change
    create_table :onboarding_plans do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user,      null: false, foreign_key: true

      t.integer :status,                null: false, default: 0
      t.integer :completion_percentage, null: false, default: 0
      t.date    :target_completion_date
      t.jsonb   :ai_metadata, default: {}

      t.timestamps
    end

    add_index :onboarding_plans, [:workspace_id, :user_id], unique: true
  end
end
