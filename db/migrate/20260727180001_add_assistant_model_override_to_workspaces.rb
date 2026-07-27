# frozen_string_literal: true

class AddAssistantModelOverrideToWorkspaces < ActiveRecord::Migration[8.1]
  def change
    change_table :workspaces, bulk: true do |t|
      t.column :ai_assistant_provider, :string
      t.column :ai_assistant_model, :string
    end
  end
end
