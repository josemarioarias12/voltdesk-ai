# frozen_string_literal: true

class AddArchivedAtAndTitleToAssistantConversations < ActiveRecord::Migration[8.1]
  def change
    change_table :assistant_conversations, bulk: true do |t|
      t.datetime :archived_at
      t.string :title
      t.index :archived_at
      t.index %i[workspace_id user_id archived_at], name: 'idx_assistant_conversations_active_lookup'
    end
  end
end
