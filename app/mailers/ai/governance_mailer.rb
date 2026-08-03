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
      User.where(role: :super_admin, active: true).pluck(:email).presence ||
        User.where(role: :workspace_admin, active: true).pluck(:email).presence ||
        [ENV.fetch('DEMO_EMAIL', 'noreply@voltdesk.app')]
    end
  end
end
