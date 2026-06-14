# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SpaceReservationPolicy do
  subject { described_class.new(user, reservation) }

  let(:workspace) { create(:workspace) }
  let(:space) { create(:space, workspace: workspace) }
  let(:owner) { create(:user, workspace: workspace, role: :employee) }
  let(:reservation) { create(:space_reservation, workspace: workspace, space: space, user: owner) }

  context 'when user is the owner' do
    let(:user) { owner }

    it { is_expected.to permit_action(:show) }
    it { is_expected.to permit_action(:create) }
    it { is_expected.to permit_action(:cancel) }
    it { is_expected.not_to permit_action(:destroy) }
  end

  context 'when user is facilities_manager' do
    let(:user) { create(:user, workspace: workspace, role: :facilities_manager) }

    it { is_expected.to permit_action(:show) }
    it { is_expected.to permit_action(:cancel) }
    it { is_expected.to permit_action(:destroy) }
  end

  context 'when user is workspace_admin' do
    let(:user) { create(:user, workspace: workspace, role: :workspace_admin) }

    it { is_expected.to permit_action(:cancel) }
    it { is_expected.to permit_action(:destroy) }
  end

  context 'when user is another employee' do
    let(:user) { create(:user, workspace: workspace, role: :employee) }

    it { is_expected.not_to permit_action(:show) }
    it { is_expected.not_to permit_action(:cancel) }
    it { is_expected.not_to permit_action(:destroy) }
  end

  context 'when user belongs to different workspace' do
    let(:other_workspace) { create(:workspace) }
    let(:user) { create(:user, workspace: other_workspace, role: :facilities_manager) }

    it { is_expected.not_to permit_action(:show) }
    it { is_expected.not_to permit_action(:cancel) }
  end

  describe 'Scope' do
    let(:other_user) { create(:user, workspace: workspace, role: :employee) }
    let!(:own_reservation) { create(:space_reservation, workspace: workspace, space: space, user: owner) }
    let!(:other_reservation) { create(:space_reservation, workspace: workspace, space: space, user: other_user) }

    context 'when user is employee' do
      let(:user) { owner }

      it 'returns only own reservations' do
        scope = described_class::Scope.new(user, SpaceReservation).resolve
        expect(scope).to include(own_reservation)
        expect(scope).not_to include(other_reservation)
      end
    end

    context 'when user is facilities_manager' do
      let(:user) { create(:user, workspace: workspace, role: :facilities_manager) }

      it 'returns all workspace reservations' do
        scope = described_class::Scope.new(user, SpaceReservation).resolve
        expect(scope).to include(own_reservation, other_reservation)
      end
    end
  end
end
