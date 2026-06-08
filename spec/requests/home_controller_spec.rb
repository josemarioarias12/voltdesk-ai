# frozen_string_literal: true

require 'rails_helper'

RSpec.describe HomeController, type: :request do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :employee) }

  before { sign_in user }

  describe 'GET /' do
    it 'returns 200' do
      get root_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end
  end
end
