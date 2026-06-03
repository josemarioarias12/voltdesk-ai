class AddAiSettingsToWorkspaces < ActiveRecord::Migration[8.1]
  def change
    add_column :workspaces, :ai_provider,          :string, default: "openai",    null: false
    add_column :workspaces, :ai_model,             :string, default: "gpt-4o",    null: false
    add_column :workspaces, :ai_fallback_provider, :string, default: "openai",    null: false
    add_column :workspaces, :ai_selection_mode,    :string, default: "automatic", null: false
  end
end
