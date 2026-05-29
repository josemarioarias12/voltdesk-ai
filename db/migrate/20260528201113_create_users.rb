class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.references :workspace,  null: true,  foreign_key: true, index: true
      t.references :department, null: true,  foreign_key: true, index: true
      t.string     :first_name, null: false, default: ''
      t.string     :last_name,  null: false, default: ''

      # Devise core
      t.string  :email,              null: false, default: ''
      t.string  :encrypted_password, null: false, default: ''

      # Role enum — integer, 0..9
      t.integer :role, null: false, default: 8  # 8 = employee

      # Google OAuth
      t.string :provider
      t.string :uid

      t.boolean :active, null: false, default: true

      # Devise rememberable
      t.datetime :remember_created_at

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, [:provider, :uid], unique: true, where: "provider IS NOT NULL"
    add_index :users, [:workspace_id, :role]
  end
end