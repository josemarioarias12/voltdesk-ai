# frozen_string_literal: true

module Ai
  module Tools
    class AssetsOverview < Base
      def self.tool_name = 'assets_overview'

      def self.description
        'Returns asset inventory counts, status breakdown, and how many assets have a ' \
          'warranty expiring within 30 days, for the entire workspace. Only available to ' \
          'IT managers, operations managers, and workspace admins — asset inventory is not ' \
          'visible to other roles at all, not even their own assigned equipment.'
      end

      # Mirrors AssetPolicy#index? exactly — unlike Tickets/LeaveRequests, there is no
      # per-user or per-department scope here, access is a flat yes/no by role.
      def self.visible_to?(user)
        user.role_it_manager? || user.role_workspace_admin? ||
          user.role_super_admin? || user.role_operations_manager?
      end

      def call(**_params)
        assets = Asset.where(workspace: @workspace)

        ServiceResult.success(
          total: assets.count,
          by_status: assets.group(:status).count,
          by_asset_type: assets.group(:asset_type).count,
          warranty_expiring_soon_count: assets.warranty_expiring(30).count,
          high_risk_count: assets.high_risk.count
        )
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end
    end
  end
end
