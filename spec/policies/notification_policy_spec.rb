# frozen_string_literal: true

require 'rails_helper'

RSpec.describe NotificationPolicy do
  subject { described_class.new(user, notification) }

  let(:workspace)    { create(:workspace) }
  let(:user)         { create(:user, workspace: workspace, role: :employee) }
  let(:notification) { create(:notification, user: user, workspace: workspace) }

  it { is_expected.to be_index }

  context 'update? when own notification' do
    it { is_expected.to be_update }
  end

  context 'update? when symbol record' do
    subject { described_class.new(user, :notification) }

    it { is_expected.to be_update }
  end

  context 'update? when another user notification' do
    let(:other_user)   { create(:user, workspace: workspace, role: :employee) }
    let(:notification) { create(:notification, user: other_user, workspace: workspace) }

    it { is_expected.not_to be_update }
  end

  describe 'Scope' do
    let(:other_user)        { create(:user, workspace: workspace, role: :agent) }
    let!(:own_notification)    { create(:notification, user: user, workspace: workspace) }
    let!(:other_notification)  { create(:notification, user: other_user, workspace: workspace) }

    it 'returns only own notifications' do
      result = described_class::Scope.new(user, Notification.all).resolve
      expect(result).to include(own_notification)
      expect(result).not_to include(other_notification)
    end
  end
end
