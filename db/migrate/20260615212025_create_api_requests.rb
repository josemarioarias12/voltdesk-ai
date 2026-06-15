class CreateApiRequests < ActiveRecord::Migration[8.0]
  def change
    create_table :api_requests do |tbl|
      tbl.references :workspace, null: false, foreign_key: true
      tbl.references :api_key,   null: false, foreign_key: true
      tbl.string  :endpoint,    null: false
      tbl.string  :http_method, null: false
      tbl.integer :status_code
      tbl.integer :duration_ms
      tbl.string  :ip_address
      tbl.datetime :created_at, null: false
    end

    add_index :api_requests, [:workspace_id, :created_at]
    add_index :api_requests, [:api_key_id,   :created_at]
  end
end