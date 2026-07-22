# frozen_string_literal: true

require 'rails_helper'

RSpec.describe WebauthnCredentialsController, type: :request do
  let!(:workspace) { create(:workspace) }
  let!(:user)      { create(:user, workspace: workspace, role: :employee) }

  before { sign_in user }

  describe 'GET /settings/passkeys' do
    it 'returns 200' do
      get webauthn_credentials_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it "returns only the current user's own credentials, never a workspace-mate's" do
      create(:webauthn_credential, user: user, workspace: workspace)
      other_employee = create(:user, workspace: workspace, role: :employee)
      create(:webauthn_credential, user: other_employee, workspace: workspace)

      get webauthn_credentials_path, headers: inertia_headers
      json = response.parsed_body

      expect(json['props']['credentials'].length).to eq(1)
    end

    it 'never exposes external_id or public_key in the serialized response' do
      create(:webauthn_credential, user: user, workspace: workspace)

      get webauthn_credentials_path, headers: inertia_headers
      credential_keys = response.parsed_body['props']['credentials'].first.keys

      expect(credential_keys).not_to include('external_id', 'public_key')
    end
  end

  describe 'DELETE /settings/passkeys/:id' do
    it 'removes the credential when the user owns it' do
      credential = create(:webauthn_credential, user: user, workspace: workspace)

      expect { delete webauthn_credential_path(credential) }.to change(WebauthnCredential, :count).by(-1)
    end

    it 'logs a compliance event on revocation' do
      credential = create(:webauthn_credential, user: user, workspace: workspace)

      expect { delete webauthn_credential_path(credential) }.to change(ComplianceLog, :count).by(1)
      expect(ComplianceLog.last.event_type_webauthn_credential_revoked?).to be true
    end

    it "returns 404 when trying to delete another workspace's credential" do
      other_workspace      = create(:workspace)
      other_workspace_user = create(:user, workspace: other_workspace)
      foreign_credential = create(:webauthn_credential, user: other_workspace_user, workspace: other_workspace)

      expect { delete webauthn_credential_path(foreign_credential) }.not_to change(WebauthnCredential, :count)
      expect(response).to have_http_status(:not_found)
    end

    it "allows a workspace_admin to remove another employee's credential" do
      admin = create(:user, workspace: workspace, role: :workspace_admin)
      sign_in admin
      credential = create(:webauthn_credential, user: user, workspace: workspace)

      expect { delete webauthn_credential_path(credential) }.to change(WebauthnCredential, :count).by(-1)
    end
  end
end
