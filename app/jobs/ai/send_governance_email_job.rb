# frozen_string_literal: true

module Ai
  class SendGovernanceEmailJob < ApplicationJob
    queue_as :default
    sidekiq_options retry: 3

    def perform(suggestion_ids)
      suggestions = Ai::ModelGovernanceSuggestion.where(id: suggestion_ids)
      return if suggestions.empty?

      mail = Ai::GovernanceMailer.new_suggestions(suggestions)

      Resend::Emails.send({
                            from:    ApplicationMailer::FROM_ADDRESS,
        to:      recipients(mail),
        subject: mail.subject,
        html:    mail.html_part.body.to_s,
        text:    mail.text_part.body.to_s
                          })
    rescue StandardError => e
      Rails.logger.error("[Ai::SendGovernanceEmailJob] #{e.class}: #{e.message}")
      raise
    end

    private

    def recipients(mail)
      mail.to.is_a?(Array) ? mail.to : [mail.to]
    end
  end
end
