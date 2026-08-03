# frozen_string_literal: true

module Ai
  class GovernanceMailer < ApplicationMailer
    def new_suggestions(suggestions)
      @suggestions = suggestions
      @count       = suggestions.size

      mail(
        to:      admin_recipients,
        subject: "[VoltDesk AI] #{@count} model governance #{@count == 1 ? 'suggestion' : 'suggestions'} pending review"
      )
    end

    private

    def admin_recipients
      [ENV.fetch('GOVERNANCE_NOTIFICATION_EMAIL', 'noreply@voltdesk.app')]
    end
  end
end
