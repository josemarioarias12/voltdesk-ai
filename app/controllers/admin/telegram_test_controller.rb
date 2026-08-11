# frozen_string_literal: true

module Admin
  class TelegramTestController < Admin::BaseController
    def show
      result = Ai::OperationalIntelligenceService.call(
        workspace: current_workspace,
        period: 90.days
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
        error_message = result.error == 'insufficient_data' ? t('admin.telegram_test.insufficient_data') : result.error
        render inertia: 'Admin/TelegramTest', props: { status: 'failed', message: error_message }
      end
    end
  end
end
