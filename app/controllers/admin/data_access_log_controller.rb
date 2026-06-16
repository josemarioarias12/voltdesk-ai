# frozen_string_literal: true

module Admin
  class DataAccessLogController < ApplicationController
    def index
      authorize current_workspace, :view_data_access_log?

      per_page = 25
      offset   = ([params[:page].to_i, 1].max - 1) * per_page

      entries = ComplianceLog
                .for_workspace(current_workspace)
                .access_denied
                .where(created_at: 24.hours.ago..)
                .includes(:actor)
                .recent
                .limit(per_page)
                .offset(offset)

      total_count = ComplianceLog
                    .for_workspace(current_workspace)
                    .access_denied
                    .where(created_at: 24.hours.ago..)
                    .count

      render inertia: 'Admin/DataAccessLog/Index', props: {
        entries: entries.map { |entry| serialize_entry(entry) },
        total_count: total_count,
        period: '24h'
      }
    end

    private

    def serialize_entry(entry)
      {
        id: entry.id,
        actor: entry.actor ? { name: entry.actor.full_name, role: entry.actor.role } : nil,
        field: entry.metadata['field'],
        model: entry.metadata['model'],
        accessor_role: entry.metadata['accessor_role'],
        timestamp: entry.created_at.iso8601
      }
    end
  end
end
