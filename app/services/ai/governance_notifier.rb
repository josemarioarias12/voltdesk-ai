# frozen_string_literal: true

module Ai
  class GovernanceNotifier
    def self.notify(suggestion_ids)
      new(suggestion_ids).notify
    end

    def initialize(suggestion_ids)
      @suggestion_ids = Array(suggestion_ids).compact
    end

    def notify
      return if @suggestion_ids.empty?

      notify_telegram
      Ai::SendGovernanceEmailJob.perform_later(@suggestion_ids)
    end

    private

    def notify_telegram
      TelegramNotifier.send_prediction(
        message: telegram_message,
        level: :warning,
        link: "#{ENV.fetch('APP_HOST', 'https://voltdesk.app')}/admin/governance",
        link_label: 'Review suggestions'
      )
    end

    def telegram_message
      count = @suggestion_ids.size
      "#{count} model governance #{count == 1 ? 'suggestion' : 'suggestions'} pending review."
    end
  end
end
