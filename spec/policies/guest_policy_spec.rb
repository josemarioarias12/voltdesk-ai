# frozen_string_literal: true

require 'rails_helper'

RSpec.describe GuestPolicy do
  let(:workspace) { create(:workspace) }
  let(:guest)     { create(:user, :guest, workspace:) }
  let(:employee)  { create(:user, :employee, workspace:) }

  describe 'guest role' do
    it 'allows create' do
      expect(described_class.new(guest, :ticket).create?).to be true
    end

    it 'denies index' do
      expect(described_class.new(guest, :ticket).index?).to be false
    end

    it 'denies show' do
      expect(described_class.new(guest, :ticket).show?).to be false
    end

    it 'denies update' do
      expect(described_class.new(guest, :ticket).update?).to be false
    end

    it 'denies destroy' do
      expect(described_class.new(guest, :ticket).destroy?).to be false
    end
  end

  describe 'non-guest role' do
    it 'denies create for employee' do
      expect(described_class.new(employee, :ticket).create?).to be false
    end
  end
end
