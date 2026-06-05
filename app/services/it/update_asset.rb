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

      ServiceResult.success(@asset)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end
  end
end
