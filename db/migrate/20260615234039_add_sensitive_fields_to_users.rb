class AddSensitiveFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :salary, :decimal
    add_column :users, :bank_account, :string
  end
end
