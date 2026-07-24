# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DemoController, type: :request do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace: workspace) }
  let(:token)      { 'test-demo-token' }
  let(:guest)      { create(:user, :guest, workspace: workspace) }

  before { REDIS.flushdb }
  after  { REDIS.flushdb }

  describe 'GET /demo/new_ticket' do
    context 'with an active demo session' do
      before do
        REDIS.set("demo_token:#{token}", workspace.id, ex: 1800)
        REDIS.set("demo_count:#{token}", 3)
        sign_in guest
        allow_any_instance_of(ActionDispatch::Request::Session).to receive(:[]).and_call_original
        allow_any_instance_of(ActionDispatch::Request::Session).to receive(:[]).with(:demo_token).and_return(token)
      end

      it 'returns 200' do
        get demo_new_ticket_path, headers: inertia_headers
        expect(response).to have_http_status(:ok)
      end

      it 'returns workspace_name, expires_in, guest_count, and departments props' do
        department
        get demo_new_ticket_path, headers: inertia_headers
        json = response.parsed_body
        expect(json['props']).to include('workspace_name', 'expires_in', 'guest_count', 'departments')
        expect(json['props']['workspace_name']).to eq(workspace.name)
        expect(json['props']['guest_count']).to eq(3)
      end

      it 'does not increment the guest count' do
        get demo_new_ticket_path, headers: inertia_headers
        expect(REDIS.get("demo_count:#{token}")).to eq('3')
      end
    end

    context 'without an active demo token in Redis' do
      before do
        sign_in guest
        allow_any_instance_of(ActionDispatch::Request::Session).to receive(:[]).and_call_original
        allow_any_instance_of(ActionDispatch::Request::Session).to receive(:[]).with(:demo_token).and_return(token)
      end

      it 'redirects as unauthorized' do
        get demo_new_ticket_path, headers: inertia_headers
        expect(response).to redirect_to(root_path)
      end
    end

    context 'when not authenticated' do
      it 'renders the login page instead of the demo screen' do
        get demo_new_ticket_path, headers: inertia_headers
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['component']).to eq('Auth/Login')
      end
    end
  end
end
