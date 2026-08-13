# frozen_string_literal: true

module It
  class UpdateAsset
    def self.call(**args) = new(**args).call

    def initialize(asset:, user:, params:)
      @asset = asset
      @user  = user
      @params = params
    end

    def call
      return ServiceResult.failure(@asset.errors.full_messages.join(', ')) unless @asset.update(@params)

      It::CalculateAssetRisk.call(asset: @asset, user: @user)
      ActionCable.server.broadcast("asset_#{@asset.id}", { status: @asset.status })
      ActionCable.server.broadcast("assets_workspace_#{@asset.workspace_id}", { status: @asset.status })

      ServiceResult.success(@asset)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end
  end
end
