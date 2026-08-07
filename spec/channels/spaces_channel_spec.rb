# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SpacesChannel, type: :channel do
  describe '.broadcast_avatar_position' do
    let(:workspace) { create(:workspace) }
    let(:space) { create(:space, workspace: workspace) }
    let(:user) { create(:user, workspace: workspace) }
    let(:reservation) do
      create(:space_reservation, workspace: workspace, space: space, user: user, attendees_count: 1)
    end

    it 'resolves a real avatar_url when the user has one attached' do
      user.avatar.attach(
        io: StringIO.new('fake image data'),
        filename: 'avatar.jpg',
        content_type: 'image/jpeg'
      )

      expect do
        described_class.broadcast_avatar_position(workspace, reservation)
      end.to have_broadcasted_to("spaces:#{workspace.id}").with(
        hash_including(reservation: hash_including(user_avatar_url: a_string_matching(%r{^https?://})))
      )
    end

    it 'broadcasts an avatar_positioned event with reservation details' do
      expect do
        described_class.broadcast_avatar_position(workspace, reservation)
      end.to have_broadcasted_to("spaces:#{workspace.id}").with(
        type: 'avatar_positioned',
        reservation: {
          space_id: space.id,
          user_id: user.id,
          user_name: user.full_name,
          user_avatar_url: nil,
          start_at: reservation.start_at,
          end_at: reservation.end_at
        }
      )
    end
  end
end
