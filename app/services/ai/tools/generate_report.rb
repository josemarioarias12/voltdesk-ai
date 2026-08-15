# frozen_string_literal: true

module Ai
  module Tools
    class GenerateReport < Base
      REPORT_TYPES = %w[tickets leave_requests assets].freeze
      FORMATS = %w[pdf xlsx csv].freeze

      def self.tool_name = 'generate_report'

      def self.description
        'Generates a downloadable report file (PDF, Excel, or CSV) of the tickets, leave ' \
          'requests, or assets the current user has access to, optionally filtered by ' \
          'status. The report always reflects the exact same scope and permissions as the ' \
          'other assistant tools — it never includes data the user could not otherwise see, ' \
          'and asset reports specifically are only available to IT/operations managers and ' \
          'admins, same restriction as assets_overview.'
      end

      def self.parameters_schema
        {
          type: 'object',
          properties: {
            report_type: {
              type: 'string',
              enum: REPORT_TYPES,
              description: 'Which dataset to report on.'
            },
            format: {
              type: 'string',
              enum: FORMATS,
              description: 'File format for the report.'
            },
            status_filter: {
              type: 'string',
              description: 'Optional status to filter by (e.g. "open", "resolved", ' \
                           '"pending"). Must be a real status value for the chosen report_type.'
            }
          },
          required: %w[report_type format]
        }
      end

      def self.visible_to?(user)
        !user.role_guest?
      end

      def call(report_type:, format:, status_filter: nil)
        unless REPORT_TYPES.include?(report_type.to_s)
          return ServiceResult.failure("Unsupported report_type: #{report_type}")
        end
        return ServiceResult.failure("Unsupported format: #{format}") unless FORMATS.include?(format.to_s)

        records_result = resolve_records(report_type.to_sym, status_filter)
        return records_result if records_result.failure?

        report_result = Reports::GenerateReport.call(
          report_type: report_type.to_sym,
          records: records_result.data,
          format: format.to_sym,
          locale: @locale || 'en'
        )
        return report_result if report_result.failure?

        ServiceResult.success(
          total_records: records_result.data.count,
          filename: report_result.data[:filename],
          attachment: {
            filename: report_result.data[:filename],
            content_type: report_result.data[:content_type],
            data: report_result.data[:data]
          }
        )
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end

      private

      def resolve_records(report_type, status_filter)
        case report_type
        when :tickets then resolve_tickets(status_filter)
        when :leave_requests then resolve_leave_requests(status_filter)
        when :assets then resolve_assets(status_filter)
        end
      end

      def resolve_tickets(status_filter)
        return ServiceResult.failure("Invalid status: #{status_filter}") if invalid_status?(Ticket, status_filter)

        scope = TicketPolicy::Scope.new(@user, Ticket.where(workspace: @workspace)).resolve
        scope = scope.where(status: status_filter) if status_filter.present?
        ServiceResult.success(scope.includes(:department, :assigned_to, :created_by).order(updated_at: :desc))
      end

      def resolve_leave_requests(status_filter)
        return ServiceResult.failure("Invalid status: #{status_filter}") if invalid_status?(LeaveRequest, status_filter)

        scope = LeaveRequestPolicy::Scope.new(@user, LeaveRequest.where(workspace: @workspace)).resolve
        scope = scope.where(status: status_filter) if status_filter.present?
        ServiceResult.success(scope.includes(:user, :department, :approved_by).order(updated_at: :desc))
      end

      def resolve_assets(status_filter)
        unless Ai::Tools::AssetsOverview.visible_to?(@user)
          return ServiceResult.failure('Asset inventory is not available to your role')
        end
        return ServiceResult.failure("Invalid status: #{status_filter}") if invalid_status?(Asset, status_filter)

        scope = Asset.where(workspace: @workspace)
        scope = scope.where(status: status_filter) if status_filter.present?
        ServiceResult.success(scope.includes(:assigned_to, :department).order(updated_at: :desc))
      end

      def invalid_status?(model_class, status_filter)
        status_filter.present? && !model_class.statuses.key?(status_filter.to_s)
      end
    end
  end
end
