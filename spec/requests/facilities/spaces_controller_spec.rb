# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Facilities::SpacesController, type: :request do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :workspace_admin) }

  before { sign_in user }

  describe 'GET /facilities/spaces' do
    it 'returns 200' do
      get facilities_spaces_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'includes utilization_today for each space in the initial payload' do
      space = create(:space, workspace: workspace)
      create(:space_reservation, workspace: workspace, space: space, user: user,
             start_at: Time.current.change(hour: 9), end_at: Time.current.change(hour: 10))

      get facilities_spaces_path, headers: inertia_headers
      json = response.parsed_body
      serialized = json['props']['spaces'].find { |sp| sp['id'] == space.id }

      expect(serialized['utilization_today']).to be_present
      expect(serialized['utilization_today']['reserved_slots']).to eq(1)
    end
  end
end
