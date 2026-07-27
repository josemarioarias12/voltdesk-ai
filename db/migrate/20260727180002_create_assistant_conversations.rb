# frozen_string_literal: true

class CreateAssistantConversations < ActiveRecord::Migration[8.1]
  def change
    create_table :assistant_conversations do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.timestamps
    end

    create_table :assistant_messages do |t|
      t.references :assistant_conversation, null: false, foreign_key: true
      t.integer :role, null: false, default: 0
      t.text :content, null: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
  end
end
