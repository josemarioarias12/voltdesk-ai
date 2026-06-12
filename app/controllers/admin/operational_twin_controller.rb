# frozen_string_literal: true

module Admin
  class OperationalTwinController < ApplicationController
    def show
      authorize :operational_twin, :show?
      tickets = current_workspace.tickets
                                 .where.not(status: %i[resolved closed])
                                 .includes(:department)
                                 .map { |tkt| serialize(tkt) }

      alert_dept_ids = current_workspace.pattern_alerts
                                        .where(resolved_at: nil)
                                        .filter_map { |alert| alert.metadata&.dig('department_id') }

      render inertia: 'Admin/OperationalTwin', props: {
        tickets:                        tickets,
        pattern_alert_department_ids:   alert_dept_ids
      }
    end

    private

    def serialize(tkt)
      {
        id:            tkt.id,
        title:         tkt.title,
        priority:      tkt.priority,
        status:        tkt.status,
        category:      tkt.category,
        department_id: tkt.department_id
      }
    end
  end
end
