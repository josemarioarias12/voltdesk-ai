# frozen_string_literal: true

module Admin
  class TelegramTestController < Admin::BaseController
    def show
      render inertia: 'Admin/TelegramTest'
    end

    def create
      Ai::OperationalIntelligenceBriefJob.perform_later(current_workspace.id)
      redirect_to admin_telegram_test_path, notice: t('admin.telegram_test.queued')
    end
  end
end
