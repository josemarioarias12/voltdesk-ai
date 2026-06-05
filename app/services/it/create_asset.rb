# frozen_string_literal: true

module It
  class CreateAsset
    def self.call(**args) = new(**args).call

    def initialize(workspace:, user:, params:)
      @workspace = workspace
      @user      = user
      @params    = params
    end

    def call
      asset = @workspace.assets.build(
        @params.merge(asset_number: generate_number)
      )

      return ServiceResult.failure(asset.errors.full_messages.join(', ')) unless asset.save

      It::CalculateAssetRisk.call(asset: asset, user: @user)

      ServiceResult.success(asset)
    rescue StandardError => e
      ServiceResult.failure(e.message)
    end

    private

    def generate_number
      count = @workspace.assets.count + 1
      "AST-#{count.to_s.rjust(5, '0')}"
    end
  end
end
