class CreateWebauthnCredentials < ActiveRecord::Migration[8.1]
  def change
    create_table :webauthn_credentials do |t|
      t.references :workspace, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :external_id, null: false
      t.string :public_key, null: false
      t.integer :sign_count, null: false, default: 0
      t.integer :credential_type, null: false, default: 0
      t.string :nickname
      t.datetime :last_used_at

      t.timestamps
    end

    add_index :webauthn_credentials, :external_id, unique: true
    add_index :webauthn_credentials, [:workspace_id, :user_id]
  end
end