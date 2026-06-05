# frozen_string_literal: true

module Admin
  class PatternAlertsController < BaseController
    def index
      alerts = current_workspace.pattern_alerts.order(created_at: :desc)

      render inertia: 'Admin/PatternAlerts/Index', props: {
        alerts: alerts.map { |a| serialize_alert(a) }
      }
    end

    def update
      alert = current_workspace.pattern_alerts.find(params.expect(:id))

      if alert.resolve!
        redirect_to admin_pattern_alerts_path, notice: t('admin.pattern_alerts.resolved')
      else
        redirect_to admin_pattern_alerts_path, alert: t('admin.pattern_alerts.resolve_failed')
      end
    end

    private

    def serialize_alert(alert)
      {
        id: alert.id,
        alert_type: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        metadata: alert.metadata,
        resolved: alert.resolved?,
        resolved_at: alert.resolved_at,
        created_at: alert.created_at
      }
    end
  end
end
