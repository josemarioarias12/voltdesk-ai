# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::TelegramTestController, type: :request do
  let(:workspace)       { create(:workspace) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee)        { create(:user, workspace: workspace, role: :employee) }

  describe 'GET /admin/telegram-test' do
    before { sign_in workspace_admin }

    it 'redirects employee' do
      sign_in employee
      get admin_telegram_test_path, headers: inertia_headers
      expect(response).to have_http_status(:redirect)
    end

    it 'returns 200 without triggering any AI call or Telegram send' do
      expect(Ai::OperationalIntelligenceBriefJob).not_to receive(:perform_later)
      expect(TelegramNotifier).not_to receive(:send_prediction)
      get admin_telegram_test_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /admin/telegram-test' do
    before { sign_in workspace_admin }

    it 'redirects employee' do
      sign_in employee
      post admin_telegram_test_create_path
      expect(response).to have_http_status(:redirect)
    end

    it 'enqueues the brief job for the current workspace' do
      expect(Ai::OperationalIntelligenceBriefJob).to receive(:perform_later).with(workspace.id)
      post admin_telegram_test_create_path
    end

    it 'redirects back with a queued notice' do
      allow(Ai::OperationalIntelligenceBriefJob).to receive(:perform_later)
      post admin_telegram_test_create_path
      expect(response).to redirect_to(admin_telegram_test_path)
      expect(flash[:notice]).to eq(I18n.t('admin.telegram_test.queued'))
    end
  end
end
