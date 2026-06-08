# frozen_string_literal: true

require 'rails_helper'

RSpec.describe It::CreateAsset do
  subject(:result) { described_class.call(workspace: workspace, user: user, params: params) }

  let(:workspace) { create(:workspace) }
  let(:user)      { create(:user, workspace: workspace, role: :it_manager) }

  context 'with valid params' do
    let(:params) { { name: 'MacBook Pro', asset_type: :laptop, status: :active } }

    it 'returns success' do
      expect(result).to be_success
    end

    it 'creates the asset' do
      expect { result }.to change(Asset, :count).by(1)
    end

    it 'generates an asset number' do
      expect(result.data.asset_number).to match(/\AAST-\d{5}\z/)
    end

    it 'triggers risk calculation' do
      allow(It::CalculateAssetRisk).to receive(:call)
      result
      expect(It::CalculateAssetRisk).to have_received(:call).with(asset: anything, user: user)
    end
  end

  context 'with invalid params' do
    let(:params) { { name: '', asset_type: :laptop } }

    it 'returns failure' do
      expect(result).to be_failure
    end

    it 'does not create an asset' do
      expect { result }.not_to change(Asset, :count)
    end
  end
end
