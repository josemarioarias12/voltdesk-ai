class CreateApiKeys < ActiveRecord::Migration[8.0]
  def change
    create_table :api_keys do |tbl|
      tbl.references :workspace, null: false, foreign_key: true
      tbl.references :user,      null: false, foreign_key: true
      tbl.string   :name,        null: false
      tbl.string   :key_digest,  null: false
      tbl.datetime :last_used_at
      tbl.boolean  :active,      null: false, default: true
      tbl.jsonb    :scopes,      null: false, default: []

      tbl.timestamps
    end

    add_index :api_keys, :key_digest, unique: true
  end
end