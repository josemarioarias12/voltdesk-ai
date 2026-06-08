# frozen_string_literal: true

require 'rails_helper'

RSpec.describe NotificationsController, type: :request do
  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :agent) }

  before { sign_in user }

  describe 'GET /notifications' do
    it 'returns 200' do
      get notifications_path, headers: inertia_headers
      expect(response).to have_http_status(:ok)
    end

    it 'returns only current user notifications' do
      create(:notification, user: user, workspace: workspace)
      other = create(:user, workspace: workspace, role: :agent)
      create(:notification, user: other, workspace: workspace)
      get notifications_path, headers: inertia_headers
      json = response.parsed_body
      expect(json['props']['notifications'].length).to eq(1)
    end
  end

  describe 'POST /notifications/mark_read' do
    let!(:notification) { create(:notification, user: user, workspace: workspace, read: false) }

    it 'marks all notifications as read' do
      create(:notification, user: user, workspace: workspace, read: false)
      post mark_read_notifications_path(id: 'all')
      expect(user.notifications.unread.count).to eq(0)
    end

    it 'redirects after marking read' do
      post mark_read_notifications_path(id: 'all')
      expect(response).to have_http_status(:redirect)
    end
  end
end
