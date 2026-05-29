# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserPolicy do
  let(:workspace)            { create(:workspace) }
  let(:admin)                { create(:user, :workspace_admin, workspace:) }
  let(:employee)             { create(:user, :employee, workspace:) }
  let(:other_employee)       { create(:user, :employee, workspace:) }
  let(:other_workspace_user) { create(:user, :employee) }

  describe '#index?' do
    it 'allows workspace_admin' do
      expect(described_class.new(admin, User).index?).to be true
    end

    it 'denies employee' do
      expect(described_class.new(employee, User).index?).to be false
    end
  end

  describe '#show?' do
    it 'allows admin to see any user' do
      expect(described_class.new(admin, other_employee).show?).to be true
    end

    it 'allows employee to see themselves' do
      expect(described_class.new(employee, employee).show?).to be true
    end

    it 'denies employee seeing other' do
      expect(described_class.new(employee, other_employee).show?).to be false
    end
  end

  describe '#create?' do
    it 'allows admin' do
      expect(described_class.new(admin, User).create?).to be true
    end

    it 'denies employee' do
      expect(described_class.new(employee, User).create?).to be false
    end
  end

  describe '#update?' do
    it 'allows admin to update anyone' do
      expect(described_class.new(admin, other_employee).update?).to be true
    end

    it 'allows employee to update self' do
      expect(described_class.new(employee, employee).update?).to be true
    end

    it 'denies employee updating other' do
      expect(described_class.new(employee, other_employee).update?).to be false
    end
  end

  describe '#destroy?' do
    it 'allows admin to destroy other' do
      expect(described_class.new(admin, other_employee).destroy?).to be true
    end

    it 'denies admin self-destroy' do
      expect(described_class.new(admin, admin).destroy?).to be false
    end

    it 'denies employee any destroy' do
      expect(described_class.new(employee, other_employee).destroy?).to be false
    end
  end

  describe 'Scope' do
    it 'returns only users in the same workspace' do
      Current.workspace = workspace
      scope = described_class::Scope.new(employee, User).resolve
      expect(scope).to include(employee, other_employee)
      expect(scope).not_to include(other_workspace_user)
      Current.workspace = nil
    end
  end
end
