# frozen_string_literal: true

class CreateTicketEmbeddings < ActiveRecord::Migration[8.0]
  def up
    create_table :ticket_embeddings do |t|
      t.references :ticket, null: false, foreign_key: true, index: { unique: true }
      t.references :workspace, null: false, foreign_key: true
      t.column :embedding, :vector, limit: 1536, null: false
      t.text :content, null: false

      t.timestamps
    end

    execute <<~SQL
      CREATE INDEX idx_ticket_embeddings_hnsw
        ON ticket_embeddings
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    SQL

    add_index :ticket_embeddings, :workspace_id, name: "idx_ticket_embeddings_workspace"
  end

  def down
    drop_table :ticket_embeddings
  end
end
