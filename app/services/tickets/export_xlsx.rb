# frozen_string_literal: true

module Tickets
  class ExportXlsx
    def self.call(scope:) = new(scope: scope).call

    def initialize(scope:)
      @scope = scope
    end

    def call
      package  = Axlsx::Package.new
      workbook = package.workbook

      workbook.add_worksheet(name: 'Tickets') do |sheet|
        header_style = sheet.styles.add_style(b: true, bg_color: 'E2E8F0')
        sheet.add_row Tickets::ExportCsv::HEADERS, style: header_style
        rows.each { |row| sheet.add_row row }
      end

      ServiceResult.success(package.to_stream.read)
    rescue StandardError => e
      Rails.logger.error("[Tickets::ExportXlsx] #{e.message}")
      ServiceResult.failure('Could not generate Excel export.')
    end

    private

    def rows
      @scope.includes(:department, :assigned_to, :created_by).find_each.map { |ticket| row_for(ticket) }
    end

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
