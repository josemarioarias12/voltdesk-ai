# frozen_string_literal: true

module Tickets
  class ExportPdf
    def self.call(scope:) = new(scope: scope).call

    def initialize(scope:)
      @scope = scope
    end

    def call
      ServiceResult.success(render_pdf)
    rescue StandardError => e
      Rails.logger.error("[Tickets::ExportPdf] #{e.message}")
      ServiceResult.failure('Could not generate PDF export.')
    end

    private

    def render_pdf
      Prawn::Document.new(page_layout: :landscape) do |pdf|
        pdf.font_families.update( # rubocop:disable Rails/SaveBang
          'Helvetica' => { normal: 'Helvetica', bold: 'Helvetica-Bold' }
        )

        pdf.font('Helvetica', style: :bold, size: 16) { pdf.text 'VoltDesk AI — Tickets Export' }
        pdf.font('Helvetica', size: 9) { pdf.text "Generated: #{Time.current.iso8601}" }
        pdf.move_down 10

        pdf.font('Helvetica', size: 8) do
          pdf.table([Tickets::ExportCsv::HEADERS] + rows, header: true, width: pdf.bounds.width) do
            row(0).font_style = :bold
            row(0).background_color = 'E2E8F0'
            cells.padding = 4
            cells.size = 8
          end
        end
      end.render
    end

    def rows
      @scope.includes(:department, :assigned_to, :created_by).find_each.map { |ticket| row_for(ticket) }
    end

    def row_for(ticket)
      [
        ticket.ticket_number,
        ticket.title.to_s.truncate(40),
        ticket.status,
        ticket.priority,
        ticket.category,
        ticket.department.name,
        ticket.created_by.full_name,
        ticket.assigned_to&.full_name || '—',
        ticket.created_at.strftime('%Y-%m-%d'),
        ticket.due_at&.strftime('%Y-%m-%d') || '—',
        ticket.resolved_at&.strftime('%Y-%m-%d') || '—',
        ticket.sla_status.to_s
      ]
    end
  end
end
