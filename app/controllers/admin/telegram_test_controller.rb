# frozen_string_literal: true

module Admin
  class TelegramTestController < Admin::BaseController
    def show
      result = Ai::OperationalIntelligenceService.call(
        workspace: current_workspace,
        period: 1.day
      )

      if result.success?
        prediction = result.data[:predictions]&.first
        message    = if prediction
                       "#{prediction[:message]} — #{prediction[:recommendation]}"
                     else
                       result.data[:summary].to_s
                     end
        TelegramNotifier.send_prediction(message: message, level: :info)
        render inertia: 'Admin/TelegramTest', props: { status: 'sent', message: message }
      else
        render inertia: 'Admin/TelegramTest', props: { status: 'failed', message: result.error }
      end
    end
  end
end
