# frozen_string_literal: true

class AddUniqueIndexToAssetsAssetNumber < ActiveRecord::Migration[8.0]
  def change
    add_index :assets, %i[workspace_id asset_number], unique: true, name: "index_assets_on_workspace_id_and_asset_number"
  end
end
