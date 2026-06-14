# frozen_string_literal: true

module Admin
  class OperationalTwinController < ApplicationController
    def show
      authorize :operational_twin, :show?

      tickets = current_workspace.tickets
                                 .where.not(status: %i[resolved closed])
                                 .includes(:department)
                                 .map { |tkt| serialize(tkt) }

      semantic_dept_ids = current_workspace.pattern_alerts
                                           .where(resolved_at: nil)
                                           .where(alert_type: :ticket_cluster)
                                           .filter_map { |alert| alert.metadata&.dig('department_id') }

      anomaly_dept_ids  = current_workspace.pattern_alerts
                                           .where(resolved_at: nil)
                                           .where(alert_type: :department_surge)
                                           .filter_map { |alert| alert.metadata&.dig('department_id') }

      render inertia: 'Admin/OperationalTwin', props: {
        tickets:                        tickets,
        pattern_alert_department_ids:   semantic_dept_ids,
        anomaly_alert_department_ids:   anomaly_dept_ids
      }
    end

    private

    def serialize(tkt)
      {
        id:              tkt.id,
        title:           tkt.title,
        priority:        tkt.priority,
        status:          tkt.status,
        category:        tkt.category,
        department_id:   tkt.department_id,
        department_name: tkt.department&.name
      }
    end
  end
end
