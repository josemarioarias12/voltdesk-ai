# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::TelegramTestController, type: :request do
  let(:workspace)       { create(:workspace) }
  let(:workspace_admin) { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee)        { create(:user, workspace: workspace, role: :employee) }
  let(:adapter) { instance_double(Ai::Providers::OpenaiAdapter) }

  let(:mock_response) do
    {
      content: '{"predictions":[{"type":"volume_spike","confidence":0.87,"message":"Spike expected",' \
               '"recommendation":"Add agents","urgency":"warning"}],"summary":"Normal week."}',
      tokens: 350
    }
  end

  before do
    router = instance_double(Ai::ModelRouter)
    allow(Ai::ModelRouter).to receive(:for).and_return(router)
    allow(router).to receive(:resolve).and_return([adapter, 'gpt-4o', 'openai'])
    allow(adapter).to receive(:chat).and_return(mock_response)
    allow_any_instance_of(Ai::OperationalIntelligenceService).to receive(:with_ai_audit).and_yield({})
  end

  describe 'GET /admin/telegram-test' do
    before { sign_in workspace_admin }

    it 'redirects employee' do
      sign_in employee
      get admin_telegram_test_path, headers: inertia_headers
      expect(response).to have_http_status(:redirect)
    end

    context 'with enough recent tickets' do
      before { create_list(:ticket, 5, workspace: workspace, created_at: 2.days.ago) }

      it 'returns 200 with a sent status' do
        get admin_telegram_test_path, headers: inertia_headers
        expect(response).to have_http_status(:ok)
      end

      it 'sends the prediction via TelegramNotifier' do
        expect(TelegramNotifier).to receive(:send_prediction).with(message: a_string_including('Spike expected'),
                                                                   level: :info)
        get admin_telegram_test_path, headers: inertia_headers
      end
    end

    context 'without enough recent tickets' do
      it 'returns 200 with a translated failure message, not the raw error code' do
        get admin_telegram_test_path, headers: inertia_headers
        expect(response).to have_http_status(:ok)
        expect(response.body).to include(I18n.t('admin.telegram_test.insufficient_data'))
        expect(response.body).not_to include('insufficient_data')
      end
    end
  end
end
