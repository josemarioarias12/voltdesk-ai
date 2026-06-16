# frozen_string_literal: true

module Tickets
  class RecordClassificationCorrection
    def self.call(ticket:, agent:, corrected_category:, note: nil)
      original_category = ticket.ai_metadata&.dig('category')

      return ServiceResult.failure('ticket_not_ai_classified') if original_category.blank?
      return ServiceResult.failure('no_change') if original_category == corrected_category.to_s

      correction = ClassificationCorrection.create!(
        workspace:          ticket.workspace,
        ticket:             ticket,
        agent:              agent,
        original_category:  original_category,
        corrected_category: corrected_category.to_s,
        correction_note:    note
      )

      ServiceResult.success(correction)
    rescue StandardError => e
      Rails.logger.error("[RecordClassificationCorrection] #{e.message}")
      ServiceResult.failure(e.message)
    end
  end
end
