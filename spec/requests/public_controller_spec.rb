# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PublicController, type: :request do
  describe 'GET /' do
    context 'when not authenticated' do
      it 'returns 200 and renders the landing page' do
        get root_path, headers: inertia_headers
        expect(response).to have_http_status(:ok)
      end
    end

    context 'when authenticated' do
      let(:workspace) { create(:workspace) }
      let(:user)      { create(:user, workspace: workspace, role: :employee) }

      before { sign_in user }

      it 'redirects to the dashboard' do
        get root_path, headers: inertia_headers
        expect(response).to redirect_to(dashboard_path)
      end
    end
  end
end
