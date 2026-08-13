# frozen_string_literal: true

module Ai
  module Tools
    class ExplainDecision < Base
      def self.tool_name = 'explain_decision'

      def self.description
        'Explains why the AI classified a specific ticket the way it did — category, priority, ' \
          'urgency_score, and the signals behind that decision. Takes the ticket_number the user ' \
          'refers to it by (e.g. TK-00191) — never look up or guess a database id. If a matching ' \
          'audit log entry is found, also includes real cost, token, and latency data; if not, ' \
          'audit_trail_found will be false — in that case explain using only the classification ' \
          'reasoning, and do not mention or invent cost, tokens, or duration.'
      end

      def self.parameters_schema
        {
          type: 'object',
          properties: {
            ticket_number: {
              type: 'string',
              description: 'The ticket display number, e.g. "TK-00191", as the user refers to it.'
            }
          },
          required: %w[ticket_number]
        }
      end

      def self.visible_to?(user)
        !user.role_guest?
      end

      def call(ticket_number:)
        ticket = @workspace.tickets.find_by(ticket_number: normalize_ticket_number(ticket_number))
        return ServiceResult.failure("No ticket found with number #{ticket_number} in this workspace.") unless ticket
        return ServiceResult.failure('You do not have access to this ticket.') unless TicketPolicy.new(@user,
                                                                                                       ticket).show?
        return ServiceResult.failure('This ticket has not been classified by AI yet.') if ticket.ai_metadata.blank?

        audit_log = find_audit_log(ticket)

        ServiceResult.success(
          ticket_number: ticket.ticket_number,
          category: ticket.ai_metadata['category'],
          priority: ticket.ai_metadata['priority'],
          urgency_score: ticket.ai_metadata['urgency_score'],
          reasoning: ticket.ai_metadata['reasoning'],
          tags: ticket.ai_metadata['tags'],
          model: ticket.ai_metadata['model'],
          provider: ticket.ai_metadata['provider'],
          audit_trail_found: audit_log.present?,
          audit_trail: audit_trail_summary(audit_log)
        )
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end

      private

      def normalize_ticket_number(value)
        digits = value.to_s.gsub(/\D/, '')
        return value.to_s.strip.upcase if digits.blank?

        "TK-#{digits.rjust(5, '0')}"
      end

      def find_audit_log(ticket)
        AiAuditLog
          .where(workspace_id: ticket.workspace_id, operation: :ticket_classification)
          .where('prompt LIKE ?', "Ticket ##{ticket.ticket_number}\n%")
          .order(created_at: :desc)
          .first
      end

      def audit_trail_summary(audit_log)
        return nil unless audit_log

        {
          model: audit_log.model,
          provider: audit_log.provider,
          total_tokens: audit_log.total_tokens,
          duration_ms: audit_log.duration_ms,
          estimated_cost_usd: audit_log.estimated_cost_usd,
          classified_at: audit_log.created_at.iso8601
        }
      end
    end
  end
end
