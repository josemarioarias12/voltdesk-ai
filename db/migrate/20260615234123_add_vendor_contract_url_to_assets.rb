class AddVendorContractUrlToAssets < ActiveRecord::Migration[8.1]
  def change
    add_column :assets, :vendor_contract_url, :string
  end
end
