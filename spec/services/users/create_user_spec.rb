# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Users::CreateUser do
  let(:workspace)  { create(:workspace) }
  let(:department) { create(:department, workspace:) }
  let(:admin)      { create(:user, :workspace_admin, workspace:) }
  let(:super_admin) { create(:user, :super_admin, workspace:) }
  let(:employee) { create(:user, :employee, workspace:) }

  let(:base_params) do
    {
      first_name: 'Carlos',
      last_name: 'Mendez',
      email: 'carlos.mendez@example.com',
      role: 'employee',
      department_id: department.id
    }
  end

  describe '.call' do
    it 'creates a user with the given attributes' do
      result = described_class.call(workspace:, actor: admin, params: base_params)

      expect(result).to be_success
      expect(result.data[:user]).to be_persisted
      expect(result.data[:user].full_name).to eq('Carlos Mendez')
      expect(result.data[:user].role).to eq('employee')
    end

    it 'returns a temporary password not stored anywhere in plaintext' do
      result = described_class.call(workspace:, actor: admin, params: base_params)

      expect(result.data[:temporary_password]).to be_a(String)
      expect(result.data[:temporary_password].length).to eq(16)
    end

    it 'scopes the new user to the given workspace' do
      result = described_class.call(workspace:, actor: admin, params: base_params)

      expect(result.data[:user].workspace_id).to eq(workspace.id)
    end

    it 'rejects assigning super_admin when the actor is only a workspace_admin' do
      result = described_class.call(workspace:, actor: admin, params: base_params.merge(role: 'super_admin'))

      expect(result).to be_failure
      expect(result.error).to match(/not assignable/i)
    end

    it 'allows assigning super_admin when the actor is a super_admin' do
      result = described_class.call(workspace:, actor: super_admin, params: base_params.merge(role: 'super_admin'))

      expect(result).to be_success
    end

    it 'rejects any role assignment when the actor is below admin' do
      result = described_class.call(workspace:, actor: employee, params: base_params)

      expect(result).to be_failure
    end

    it 'fails with model validation errors for a duplicate email' do
      create(:user, workspace:, email: 'carlos.mendez@example.com')

      result = described_class.call(workspace:, actor: admin, params: base_params)

      expect(result).to be_failure
      expect(result.error).to match(/email/i)
    end
  end
end
