# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MaskableSerializer do
  subject(:serializer) do
    Class.new do
      include MaskableSerializer
    end.new
  end

  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :employee) }
  let(:asset)     { create(:asset, workspace: workspace, purchase_price: 999.99, vendor_contract_url: 'https://example.com/contract') }

  describe '#mask' do
    context 'when role cannot see the field' do
      it 'returns REDACTED_VALUE for purchase_price' do
        result = serializer.mask(asset, { purchase_price: asset.purchase_price }, user)
        expect(result[:purchase_price]).to eq(DataMaskingPolicy::REDACTED_VALUE)
      end

      it 'creates a ComplianceLog entry on denial' do
        expect do
          serializer.mask(asset, { purchase_price: asset.purchase_price }, user)
        end.to change(ComplianceLog, :count).by(1)

        log = ComplianceLog.last
        expect(log.event_type).to eq('data_access_denied')
        expect(log.metadata['field']).to eq('purchase_price')
        expect(log.metadata['model']).to eq('Asset')
      end
    end

    context 'when role can see the field' do
      let(:it_user) { create(:user, workspace: workspace, role: :it_manager) }

      it 'returns the original value for purchase_price' do
        result = serializer.mask(asset, { purchase_price: asset.purchase_price }, it_user)
        expect(result[:purchase_price]).to eq(asset.purchase_price)
      end
    end

    context 'non-sensitive fields' do
      it 'never redacts non-sensitive fields' do
        result = serializer.mask(asset, { name: asset.name }, user)
        expect(result[:name]).to eq(asset.name)
      end

      it 'does not create a ComplianceLog for non-sensitive fields' do
        expect do
          serializer.mask(asset, { name: asset.name }, user)
        end.not_to change(ComplianceLog, :count)
      end
    end
  end
end
