# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Compliance::PurgeUserData do
  subject(:service) do
    described_class.new(user: employee, requested_by: admin, workspace: workspace)
  end

  let(:workspace)   { create(:workspace) }
  let(:department)  { create(:department, workspace: workspace) }
  let(:admin)       { create(:user, workspace: workspace, role: :workspace_admin) }
  let(:employee)    { create(:user, workspace: workspace, role: :employee) }

  describe '#call' do
    it 'returns success' do
      result = service.call
      expect(result).to be_success
    end

    it 'anonymizes the user email' do
      service.call
      expect(employee.reload.email).to eq("deleted_user_#{employee.id}@purged.invalid")
    end

    it 'anonymizes the user name' do
      service.call
      expect(employee.reload.first_name).to eq('[DELETED]')
      expect(employee.reload.last_name).to eq('[DELETED]')
    end

    it 'clears provider and uid' do
      employee.update_columns(provider: 'google', uid: 'abc123')
      service.call
      expect(employee.reload.provider).to be_nil
      expect(employee.reload.uid).to be_nil
    end

    it 'nullifies ticket assignments for this user' do
      ticket = create(:ticket, workspace: workspace, department: department,
                               created_by: admin, assigned_to: employee)
      service.call
      expect(ticket.reload.assigned_to_id).to be_nil
    end

    it 'reassigns ticket created_by to ghost user' do
      ticket = create(:ticket, workspace: workspace, department: department,
                               created_by: employee)
      service.call
      expect(ticket.reload.created_by_id).not_to eq(employee.id)
      expect(ticket.reload.created_by.first_name).to eq('[SYSTEM]')
    end

    it 'creates a compliance log entry' do
      expect { service.call }.to change(ComplianceLog, :count).by(1)
    end

    it 'logs the purge event with correct metadata' do
      service.call
      log = ComplianceLog.last
      expect(log.event_type).to eq('data_purge')
      expect(log.resource_type).to eq('User')
      expect(log.resource_id).to eq(employee.id)
      expect(log.metadata['reason']).to eq('GDPR Right to Forget')
    end

    it 'destroys the user\'s webauthn credentials' do
      create(:webauthn_credential, user: employee, workspace: workspace)
      create(:webauthn_credential, user: employee, workspace: workspace)

      expect { service.call }.to change(WebauthnCredential, :count).by(-2)
    end

    it 'does not affect another user\'s webauthn credentials' do
      other_employee = create(:user, workspace: workspace, role: :employee)
      create(:webauthn_credential, user: other_employee, workspace: workspace)

      service.call

      expect(WebauthnCredential.where(user: other_employee).count).to eq(1)
    end

    it 'records the count of purged passkeys in the compliance log metadata' do
      create(:webauthn_credential, user: employee, workspace: workspace)
      create(:webauthn_credential, user: employee, workspace: workspace)

      service.call

      expect(ComplianceLog.last.metadata['webauthn_credentials_purged']).to eq(2)
    end

    context 'when user is super_admin' do
      let(:target) { create(:user, workspace: workspace, role: :super_admin) }

      it 'returns failure' do
        result = described_class.new(
          user: target, requested_by: admin, workspace: workspace
        ).call
        expect(result).to be_failure
        expect(result.error).to include('super_admin')
      end
    end
  end
end
