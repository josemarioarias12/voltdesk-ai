# frozen_string_literal: true

require 'csv'

module Tickets
  class ExportCsv
    HEADERS = [
      'Ticket Number', 'Title', 'Status', 'Priority', 'Category',
      'Department', 'Created By', 'Assigned To', 'Created At',
      'Due At', 'Resolved At', 'SLA Status'
    ].freeze

    def self.call(scope:)
      new(scope: scope).call
    end

    def initialize(scope:)
      @scope = scope
    end

    def call
      csv_data = CSV.generate(headers: true) do |csv|
        csv << HEADERS

        @scope.includes(:department, :assigned_to, :created_by).find_each do |ticket|
          csv << row_for(ticket)
        end
      end

      ServiceResult.success(csv_data)
    end

    private

    def row_for(ticket)
      [
        ticket.ticket_number,
        ticket.title,
        ticket.status,
        ticket.priority,
        ticket.category,
        ticket.department.name,
        ticket.created_by.full_name,
        ticket.assigned_to&.full_name,
        ticket.created_at.iso8601,
        ticket.due_at&.iso8601,
        ticket.resolved_at&.iso8601,
        ticket.sla_status
      ]
    end
  end
end
