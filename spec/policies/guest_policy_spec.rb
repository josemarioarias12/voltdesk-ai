# frozen_string_literal: true

require 'rails_helper'

RSpec.describe GuestPolicy do
  let(:workspace) { create(:workspace) }
  let(:guest)     { create(:user, workspace: workspace, role: :guest) }
  let(:employee)  { create(:user, workspace: workspace, role: :employee) }
  let(:token)     { SecureRandom.hex(32) }

  before { REDIS.flushdb }
  after  { REDIS.flushdb }

  def seed_token
    REDIS.set("demo_token:#{token}", workspace.id, ex: 1800)
  end

  describe '#create_ticket?' do
    context 'when guest role and active token' do
      it 'permits' do
        seed_token
        expect(described_class.new(guest, token)).to be_create_ticket
      end
    end

    context 'when guest role but expired token' do
      it 'denies' do
        expect(described_class.new(guest, token)).not_to be_create_ticket
      end
    end

    context 'when non-guest role' do
      it 'denies even with active token' do
        seed_token
        expect(described_class.new(employee, token)).not_to be_create_ticket
      end
    end
  end

  describe 'all other actions' do
    it 'denies index' do
      expect(described_class.new(guest, token)).not_to be_index
    end

    it 'denies show' do
      expect(described_class.new(guest, token)).not_to be_show
    end

    it 'denies update' do
      expect(described_class.new(guest, token)).not_to be_update
    end

    it 'denies destroy' do
      expect(described_class.new(guest, token)).not_to be_destroy
    end
  end
end
