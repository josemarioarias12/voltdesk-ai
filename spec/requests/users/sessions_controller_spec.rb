# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Users::SessionsController, type: :request do
  let(:workspace) { create(:workspace) }
  let(:user) { create(:user, workspace: workspace, role: :employee, password: 'Password123!') }

  describe 'GET /users/login' do
    it 'returns 200' do
      get new_user_session_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /users/login' do
    context 'with valid credentials' do
      it 'signs in and redirects to root' do
        post user_session_path, params: { user: { email: user.email, password: 'Password123!' } }
        expect(response).to have_http_status(:redirect)
        expect(response).to redirect_to(root_path)
      end
    end

    context 'with invalid credentials' do
      it 'redirects to login with alert' do
        post user_session_path, params: { user: { email: user.email, password: 'wrong' } }
        expect(response).to have_http_status(:redirect)
        expect(response).to redirect_to(login_page_path)
      end
    end

    context 'with unknown email' do
      it 'redirects to login' do
        post user_session_path, params: { user: { email: 'nobody@example.com', password: 'Password123!' } }
        expect(response).to have_http_status(:redirect)
      end
    end

    context 'when the user has no passkeys registered' do
      it 'flags the next request to prompt for Face ID activation' do
        post user_session_path, params: { user: { email: user.email, password: 'Password123!' } }
        get webauthn_credentials_path, headers: inertia_headers

        expect(response.parsed_body['props']['show_face_id_prompt']).to be true
      end

      it 'does not repeat the prompt on a second page view in the same session' do
        post user_session_path, params: { user: { email: user.email, password: 'Password123!' } }
        get webauthn_credentials_path, headers: inertia_headers
        get webauthn_credentials_path, headers: inertia_headers

        expect(response.parsed_body['props']['show_face_id_prompt']).to be false
      end
    end

    context 'when the user already has a passkey registered' do
      let!(:credential) { create(:webauthn_credential, user: user, workspace: workspace) }

      it 'does not flag the prompt' do
        post user_session_path, params: { user: { email: user.email, password: 'Password123!' } }
        get webauthn_credentials_path, headers: inertia_headers

        expect(response.parsed_body['props']['show_face_id_prompt']).to be false
      end
    end
  end
end
