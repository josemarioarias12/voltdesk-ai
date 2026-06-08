# frozen_string_literal: true

require 'rails_helper'

RSpec.describe It::UpdateAsset do
  subject(:result) { described_class.call(asset: asset, user: user, params: params) }

  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :it_manager) }
  let(:asset)     { create(:asset, workspace: workspace, name: 'Old Name') }

  context 'with valid params' do
    let(:params) { { name: 'New Name', status: :in_maintenance } }

    it 'returns success' do
      expect(result).to be_success
    end

    it 'updates the asset' do
      result
      expect(asset.reload.name).to eq('New Name')
    end

    it 'triggers risk recalculation' do
      allow(It::CalculateAssetRisk).to receive(:call)
      result
      expect(It::CalculateAssetRisk).to have_received(:call).with(asset: asset, user: user)
    end
  end

  context 'with invalid params' do
    let(:params) { { name: '' } }

    it 'returns failure' do
      expect(result).to be_failure
    end
  end
end
