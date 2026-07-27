# frozen_string_literal: true

module Ai
  module Tools
    class WorkspacePatternAlerts < Base
      def self.tool_name = 'workspace_pattern_alerts'

      def self.description
        'Returns active (unresolved) pattern alerts detected by the system for the ' \
          'workspace — ticket clusters, SLA spikes, department surges — broken down by ' \
          'severity and type. Only available to workspace_admin and super_admin, mirroring ' \
          'the same admin-only access as the Admin Control Center screen that shows these.'
      end

      # Mirrors Admin::BaseController#authorize_admin! exactly — there is no
      # PatternAlertPolicy, access control lives in that controller's before_action.
      def self.visible_to?(user)
        user.role_workspace_admin? || user.role_super_admin?
      end

      def call(**_params)
        alerts = PatternAlert.where(workspace: @workspace).active

        ServiceResult.success(
          active_count: alerts.count,
          by_severity: alerts.group(:severity).count,
          by_alert_type: alerts.group(:alert_type).count,
          critical_count: alerts.severity_critical.count
        )
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end
    end
  end
end
