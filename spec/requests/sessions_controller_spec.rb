# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SessionsController, type: :request do
  let(:workspace) { create(:workspace) }

  describe 'GET /login' do
    it 'returns 200 when not logged in' do
      get login_page_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'redirects to root when already logged in' do
      user = create(:user, workspace: workspace, role: :employee)
      sign_in user
      get login_page_path
      expect(response).to have_http_status(:redirect)
    end
  end

  describe 'GET /forgot-password' do
    it 'returns 200' do
      get forgot_password_page_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end
  end
end
