# frozen_string_literal: true

module Compliance
  class GenerateReport
    def initialize(workspace:, period_start:, period_end:)
      @workspace    = workspace
      @period_start = period_start
      @period_end   = period_end
    end

    def call
      evidence = compile_evidence
      pdf_data = render_pdf(evidence)
      ServiceResult.success({ evidence: evidence, pdf: pdf_data })
    rescue StandardError => e
      Rails.logger.error("[GenerateReport] Failed: #{e.message}")
      ServiceResult.failure(e.message)
    end

    private

    def compile_evidence
      {
        workspace:              @workspace.name,
        period:                 { start: @period_start, end: @period_end },
        generated_at:           Time.current.iso8601,
        access_log_summary:     access_log_summary,
        data_retention_config:  data_retention_config,
        encryption_status:      encryption_status,
        ai_audit_summary:       ai_audit_summary,
        incident_response:      incident_response_log,
        compliance_score:       calculate_compliance_score
      }
    end

    def access_log_summary
      logs = ComplianceLog.for_workspace(@workspace).in_period(@period_start, @period_end)
      {
        total_events:    logs.count,
        by_event_type:   logs.group(:event_type).count,
        unique_actors:   logs.where.not(actor_id: nil).distinct.count(:actor_id),
        purge_requests:  logs.where(event_type: ComplianceLog.event_types[:data_purge]).count
      }
    end

    def data_retention_config
      DataRetentionPolicy.for_workspace(@workspace).map do |policy|
        {
          resource_type:  policy.resource_type,
          retention_days: policy.retention_days,
          auto_purge:     policy.auto_purge,
          last_purge_at:  policy.last_purge_at&.iso8601
        }
      end
    end

    def encryption_status
      {
        at_rest:   'PostgreSQL 16 — AES-256 encryption enabled',
        in_transit: 'TLS 1.3 enforced via Railway infrastructure',
        backups:   'Encrypted daily snapshots via Railway PostgreSQL'
      }
    end

    def ai_audit_summary
      logs = AiAuditLog.where(workspace: @workspace)
                       .where(created_at: @period_start..@period_end)
      {
        total_operations: logs.count,
        avg_confidence:   logs.average(:confidence_score)&.round(3) || 0,
        by_provider:      logs.group(:provider).count,
        low_confidence:   logs.where('confidence_score < 0.70').count
      }
    end

    def incident_response_log
      {
        status:          'maintained',
        runbook_present: false,
        notes:           'Incident response log maintained via ComplianceLog. Runbook pending documentation.'
      }
    end

    def calculate_compliance_score
      checks = [
        ComplianceLog.for_workspace(@workspace).any?,
        DataRetentionPolicy.for_workspace(@workspace).exists?,
        AiAuditLog.exists?(workspace: @workspace),
        @workspace.users.any?
      ]
      passing = checks.count(true)
      ((passing.to_f / checks.size) * 100).round
    end

    def render_pdf(evidence)
      Prawn::Document.new do |pdf|
        pdf.font_families.update( # rubocop:disable Rails/SaveBang
          'Helvetica' => {
            normal: 'Helvetica',
            bold:   'Helvetica-Bold'
          }
        )

        # Header
        pdf.font('Helvetica', style: :bold, size: 20) { pdf.text 'VoltDesk AI — Compliance Report' }
        pdf.font('Helvetica', size: 12) { pdf.text evidence[:workspace] }
        pdf.font('Helvetica', size: 10) do
          pdf.text "Period: #{evidence[:period][:start]} — #{evidence[:period][:end]}"
          pdf.text "Generated: #{evidence[:generated_at]}"
        end
        pdf.move_down 10

        # Compliance score
        pdf.font('Helvetica', style: :bold, size: 16) do
          pdf.text "Compliance Score: #{evidence[:compliance_score]}%"
        end
        pdf.move_down 10

        # Access Controls
        pdf.font('Helvetica', style: :bold, size: 13) { pdf.text '1. Access Controls' }
        log = evidence[:access_log_summary]
        pdf.font('Helvetica', size: 10) do
          pdf.text "Total compliance events: #{log[:total_events]}"
          pdf.text "Unique actors: #{log[:unique_actors]}"
          pdf.text "GDPR purge requests: #{log[:purge_requests]}"
        end
        pdf.move_down 8

        # Data Retention
        pdf.font('Helvetica', style: :bold, size: 13) { pdf.text '2. Data Retention Policies' }
        evidence[:data_retention_config].each do |policy|
          pdf.font('Helvetica', size: 10) do
            pdf.text "#{policy[:resource_type]}: #{policy[:retention_days]} days " \
                     "(auto-purge: #{policy[:auto_purge]})"
          end
        end
        pdf.move_down 8

        # AI Audit
        pdf.font('Helvetica', style: :bold, size: 13) { pdf.text '3. AI Audit Trail' }
        ai = evidence[:ai_audit_summary]
        pdf.font('Helvetica', size: 10) do
          pdf.text "Total AI operations: #{ai[:total_operations]}"
          pdf.text "Average confidence: #{(ai[:avg_confidence].to_f * 100).round(1)}%"
          pdf.text "Low confidence operations (<70%): #{ai[:low_confidence]}"
        end
        pdf.move_down 8

        # Encryption
        pdf.font('Helvetica', style: :bold, size: 13) { pdf.text '4. Data Protection' }
        enc = evidence[:encryption_status]
        pdf.font('Helvetica', size: 10) do
          pdf.text "At rest: #{enc[:at_rest]}"
          pdf.text "In transit: #{enc[:in_transit]}"
          pdf.text "Backups: #{enc[:backups]}"
        end
      end.render
    end
  end
end
