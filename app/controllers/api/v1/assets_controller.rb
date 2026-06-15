# frozen_string_literal: true

module Api
  module V1
    class AssetsController < BaseController
      def index
        per_page     = params[:per_page].to_i
        per_page     = 25 unless per_page.positive?
        per_page     = [per_page, 100].min
        current_page = [params[:page].to_i, 1].max
        offset       = (current_page - 1) * per_page

        scope  = @current_workspace.assets
                                   .includes(:department)
                                   .then { |scp| filter_assets(scp) }
                                   .order(created_at: :desc)
        total  = scope.count
        assets = scope.limit(per_page).offset(offset)

        render_success({
                         assets: assets.map { |ast| serialize_asset(ast) },
          meta: {
            current_page: current_page,
            total_pages:  (total.to_f / per_page).ceil,
            total_count:  total
          }
                       })
      end

      def show
        asset = @current_workspace.assets.find(params.expect(:id))
        render_success(serialize_asset(asset, detailed: true))
      end

      private

      def filter_assets(scope)
        scope = scope.where(asset_type: params[:asset_type])              if params[:asset_type].present?
        scope = scope.where(status: params[:status])                      if params[:status].present?
        scope = scope.where(risk_score: params[:risk_score_min].to_i..) if params[:risk_score_min].present?
        scope
      end

      def serialize_asset(asset, detailed: false)
        base = {
          id:            asset.id,
          name:          asset.name,
          asset_type:    asset.asset_type,
          status:        asset.status,
          serial_number: asset.serial_number,
          department:    asset.department&.name,
          risk_score:    asset.risk_score,
          created_at:    asset.created_at.iso8601
        }

        return base unless detailed

        base.merge(
          incident_count:      asset.incident_count,
          warranty_expires_at: asset.warranty_expires_at&.iso8601,
          warranty_status:     warranty_status_for(asset),
          assigned_to:         asset.assigned_to&.full_name,
          purchase_date:       asset.purchase_date&.iso8601,
          notes:               asset.notes
        )
      end

      def warranty_status_for(asset)
        return 'none' unless asset.warranty_expires_at

        if asset.warranty_expires_at < Time.current
          'expired'
        elsif asset.warranty_expires_at < 30.days.from_now
          'expiring_soon'
        else
          'active'
        end
      end
    end
  end
end
