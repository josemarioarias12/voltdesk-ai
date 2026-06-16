# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DataMaskingPolicy do
  describe '.visible?' do
    context 'User sensitive fields' do
      it 'denies employee access to salary' do
        expect(described_class.visible?(field: :salary, model: 'User', role: :employee)).to be false
      end

      it 'denies employee access to bank_account' do
        expect(described_class.visible?(field: :bank_account, model: 'User', role: :employee)).to be false
      end

      it 'allows hr_manager to see salary' do
        expect(described_class.visible?(field: :salary, model: 'User', role: :hr_manager)).to be true
      end

      it 'allows hr_manager to see bank_account' do
        expect(described_class.visible?(field: :bank_account, model: 'User', role: :hr_manager)).to be true
      end

      it 'allows workspace_admin to see salary' do
        expect(described_class.visible?(field: :salary, model: 'User', role: :workspace_admin)).to be true
      end

      it 'allows super_admin to see salary' do
        expect(described_class.visible?(field: :salary, model: 'User', role: :super_admin)).to be true
      end
    end

    context 'LeaveRequest sensitive fields' do
      it 'denies it_manager access to medical_notes' do
        expect(described_class.visible?(field: :medical_notes, model: 'LeaveRequest', role: :it_manager)).to be false
      end

      it 'allows hr_manager to see medical_notes' do
        expect(described_class.visible?(field: :medical_notes, model: 'LeaveRequest', role: :hr_manager)).to be true
      end
    end

    context 'Asset sensitive fields' do
      it 'denies employee access to purchase_price' do
        expect(described_class.visible?(field: :purchase_price, model: 'Asset', role: :employee)).to be false
      end

      it 'allows it_manager to see purchase_price' do
        expect(described_class.visible?(field: :purchase_price, model: 'Asset', role: :it_manager)).to be true
      end

      it 'allows workspace_admin to see vendor_contract_url' do
        expect(described_class.visible?(field: :vendor_contract_url, model: 'Asset', role: :workspace_admin)).to be true
      end

      it 'allows super_admin to see purchase_price' do
        expect(described_class.visible?(field: :purchase_price, model: 'Asset', role: :super_admin)).to be true
      end
    end

    context 'non-sensitive fields' do
      it 'allows any role to see non-sensitive fields' do
        expect(described_class.visible?(field: :name, model: 'Asset', role: :employee)).to be true
      end
    end
  end

  describe '.sensitive_fields' do
    it 'returns sensitive fields for User' do
      expect(described_class.sensitive_fields(model: 'User')).to contain_exactly(:salary, :bank_account)
    end

    it 'returns sensitive fields for Asset' do
      expect(described_class.sensitive_fields(model: 'Asset')).to contain_exactly(:purchase_price, :vendor_contract_url)
    end

    it 'returns empty array for unknown model' do
      expect(described_class.sensitive_fields(model: 'UnknownModel')).to eq([])
    end
  end
end
