# frozen_string_literal: true

require 'csv'
require 'axlsx'

module Reports
  class GenerateReport
    HEADERS = {
      tickets: {
        en: ['Ticket Number', 'Title', 'Status', 'Priority', 'Category', 'Department',
             'Created By', 'Assigned To', 'Created At', 'Due At', 'Resolved At'],
        es: ['Número de Ticket', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Departamento',
             'Creado Por', 'Asignado A', 'Creado El', 'Vence El', 'Resuelto El']
      },
      leave_requests: {
        en: ['Employee', 'Leave Type', 'Status', 'Start Date', 'End Date', 'Business Days',
             'Department', 'Approved By', 'Created At'],
        es: ['Empleado', 'Tipo de Permiso', 'Estado', 'Fecha Inicio', 'Fecha Fin', 'Días Hábiles',
             'Departamento', 'Aprobado Por', 'Creado El']
      },
      assets: {
        en: ['Asset Number', 'Name', 'Type', 'Status', 'Department', 'Assigned To',
             'Risk Score', 'Warranty Expires', 'Last Maintenance'],
        es: ['Número de Activo', 'Nombre', 'Tipo', 'Estado', 'Departamento', 'Asignado A',
             'Puntaje de Riesgo', 'Vence Garantía', 'Último Mantenimiento']
      }
    }.freeze

    CONTENT_TYPES = {
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf'
    }.freeze

    def self.call(report_type:, records:, format:, locale:)
      new(report_type: report_type, records: records, format: format, locale: locale).call
    end

    def initialize(report_type:, records:, format:, locale:)
      @report_type = report_type.to_sym
      @records = records
      @format = format.to_sym
      @locale = locale.to_s.start_with?('es') ? :es : :en
    end

    def call
      headers = HEADERS.dig(@report_type, @locale)
      rows = @records.map { |record| row_for(record) }

      data = case @format
             when :csv then generate_csv(headers, rows)
             when :xlsx then generate_xlsx(headers, rows)
             when :pdf then generate_pdf(headers, rows)
             else raise ArgumentError, "Unsupported format: #{@format}"
             end

      ServiceResult.success(
        data: data,
        filename: "#{@report_type}_#{Date.current.iso8601}.#{@format}",
        content_type: CONTENT_TYPES.fetch(@format)
      )
    rescue StandardError => e
      Rails.logger.error("[Reports::GenerateReport] Failed: #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def row_for(record)
      case @report_type
      when :tickets then ticket_row(record)
      when :leave_requests then leave_request_row(record)
      when :assets then asset_row(record)
      end
    end

    def ticket_row(ticket)
      [
        ticket.ticket_number,
        ticket.title,
        ticket.status,
        ticket.priority,
        ticket.category,
        ticket.department&.name,
        ticket.created_by&.full_name,
        ticket.assigned_to&.full_name,
        ticket.created_at.iso8601,
        ticket.due_at&.iso8601,
        ticket.resolved_at&.iso8601
      ]
    end

    def leave_request_row(leave_request)
      [
        leave_request.user&.full_name,
        leave_request.leave_type,
        leave_request.status,
        leave_request.start_date&.iso8601,
        leave_request.end_date&.iso8601,
        leave_request.business_days,
        leave_request.department&.name,
        leave_request.approved_by&.full_name,
        leave_request.created_at.iso8601
      ]
    end

    def asset_row(asset)
      [
        asset.asset_number,
        asset.name,
        asset.asset_type,
        asset.status,
        asset.department&.name,
        asset.assigned_to&.full_name,
        asset.risk_score,
        asset.warranty_expires_at&.iso8601,
        asset.last_maintenance_at&.iso8601
      ]
    end

    def generate_csv(headers, rows)
      CSV.generate(headers: true) do |csv|
        csv << headers
        rows.each { |row| csv << row }
      end
    end

    def generate_xlsx(headers, rows)
      package = Axlsx::Package.new
      package.workbook.add_worksheet(name: 'Report') do |sheet|
        header_style = sheet.styles.add_style(
          b: true, bg_color: '028090', fg_color: 'FFFFFF', alignment: { horizontal: :center }
        )
        sheet.add_row headers, style: header_style
        rows.each { |row| sheet.add_row row }
        sheet.column_widths(*column_widths_for(headers, rows))
        sheet.auto_filter = "A1:#{('A'.ord + headers.size - 1).chr}1"
      end
      package.to_stream.read
    end

    def column_widths_for(headers, rows)
      headers.each_with_index.map do |header, i|
        longest = rows.map { |row| row[i].to_s.length }.push(header.to_s.length).max
        [longest + 2, 45].min
      end
    end

    def generate_pdf(headers, rows)
      Prawn::Document.new(page_layout: :landscape) do |pdf|
        pdf.font('Helvetica', style: :bold, size: 16) { pdf.text 'VoltDesk AI — Volt Copilot Report' }
        pdf.font('Helvetica', size: 9) { pdf.text "Generated: #{Time.current.iso8601}" }
        pdf.move_down 10

        widths = pdf_column_widths(headers, rows, pdf.bounds.width)

        pdf.table([headers] + rows, header: true, width: pdf.bounds.width, column_widths: widths) do |t|
          t.row(0).font_style = :bold
          t.row(0).background_color = 'E8F7F5'
          t.cells.size = 8
          t.cells.padding = 5
        end
      end.render
    end

    # Sizes each column proportionally to its longest value (header included),
    # so a wide field like Title doesn't get squeezed to the same width as
    # short ones like Status — that's what was forcing mid-word line breaks.
    def pdf_column_widths(headers, rows, total_width)
      max_lengths = headers.each_with_index.map do |header, i|
        [rows.map { |row| row[i].to_s.length }.max.to_i, header.to_s.length, 4].max
      end

      total_chars = max_lengths.sum.to_f
      min_width = total_width * 0.05
      raw = max_lengths.map { |len| (len / total_chars) * total_width }
      clamped = raw.map { |w| [w, min_width].max }
      scale = total_width / clamped.sum
      clamped.map { |w| w * scale }
    end
  end
end
