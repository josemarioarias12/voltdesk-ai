# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Settings::ProfileController, type: :request do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, first_name: 'Jose', last_name: 'Arias') }

  before { sign_in user }

  describe 'GET /settings/profile' do
    it 'returns 200' do
      get settings_profile_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'returns the current user props' do
      get settings_profile_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']['user']).to include('first_name' => 'Jose', 'last_name' => 'Arias')
    end
  end

  describe 'PATCH /settings/profile' do
    it 'updates the name fields' do
      patch settings_profile_path, params: { user: { first_name: 'Mario', last_name: 'Arias' } }
      expect(user.reload.first_name).to eq('Mario')
    end

    it 'redirects back to the profile page on success' do
      patch settings_profile_path, params: { user: { first_name: 'Mario', last_name: 'Arias' } }
      expect(response).to redirect_to(settings_profile_path)
    end

    it 'attaches an avatar via multipart upload' do
      patch settings_profile_path, params: {
        user: { first_name: user.first_name, last_name: user.last_name, avatar: build_avatar_upload }
      }
      expect(user.reload.avatar).to be_attached
    end
  end

  def build_avatar_upload
    tempfile = Tempfile.new(['avatar', '.png'], binmode: true)
    tempfile.write(Base64.decode64(
                     'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
                   ))
    tempfile.rewind
    Rack::Test::UploadedFile.new(tempfile.path, 'image/png')
  end
end
