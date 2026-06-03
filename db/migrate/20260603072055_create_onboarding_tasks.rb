class CreateOnboardingTasks < ActiveRecord::Migration[8.0]
  def change
    create_table :onboarding_tasks do |t|
      t.references :onboarding_plan, null: false, foreign_key: true

      t.string  :title,       null: false
      t.integer :category,    null: false, default: 0
      t.boolean :completed,   null: false, default: false
      t.integer :order_index, null: false, default: 0
      t.date    :due_date

      t.timestamps
    end

    add_index :onboarding_tasks, [:onboarding_plan_id, :order_index]
  end
end
